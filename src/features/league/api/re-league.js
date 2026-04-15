import { createFundamentalMatrix, getExpectedRewards, getVariance }
    from "../../../lib/markov/markov-mrp.js";
import { matrixBuilder } from "../../../lib/sit-val/matrix-builder.js";

const stateManager = {
    getIndex(b_idx, out, b3, b2, b1) {
        if (out >= 3) return 24; // 흡수 상태 (이닝 종료)
        // 타자 수에 따라 24 또는 216 상태로 자동 매핑
        return (b_idx * 24) + (out * 8) + (b3 * 4) + (b2 * 2) + b1;
    },

    reverseState(idx) {
        const b_idx = Math.floor(idx / 24);
        const rem = idx % 24;
        const out = Math.floor(rem / 8);
        const b_rem = rem % 8;
        const b3 = Math.floor(b_rem / 4);
        const b2 = Math.floor((b_rem % 4) / 2);
        const b1 = b_rem % 2;
        return [b_idx, out, b3, b2, b1];
    },

    nextB(b) {
        return 0;
    },

    size() {
        return 24;
    }
};

function getSituationWeights(N_data, L) {
    // 1번 타자(0), 0아웃, 무주자 상태에서 시작하는 행을 찾습니다.
    // N_data[i][j]는 i에서 시작해 j에 머무는 횟수의 기댓값입니다.
    const startNodeIdx = 0; // 보통 첫 번째 상태가 0아웃 무주자입니다.
    const expectedVisits = N_data[startNodeIdx];

    let situationWeights = Array(24).fill(0);
    for (let j = 0; j < expectedVisits.length; j++) {
        const situationIdx = j % 24; // 타순을 무시하고 24개 상황으로 압축
        situationWeights[situationIdx] += expectedVisits[j];
    }

    // 전체 합으로 나누어 비중(Probability)으로 변환
    const total = situationWeights.reduce((a, b) => a + b, 0);
    return situationWeights.map(v => v / total);

}

function getRunValue(action, runnerAbility, engine,
    RE_data, N_data) {
    let totalWeightedValue = 0;
    const weights = getSituationWeights(N_data, 1);

    for (let i = 0; i < 24; i++) {
        // 상황별 전이 결과 가져오기
        const state = stateManager.reverseState(i);
        const stateObj = { out: state[1], b3: state[2], b2: state[3], b1: state[4] };
        const transitions = engine.getTransitions(action, stateObj, runnerAbility);

        // 해당 상황에서의 RE24 가치 계산
        let actionValue = 0;
        const RE_before = RE_data[i][0];

        for (const t of transitions) {
            const nextOut = stateObj.out + t.outDelta;
            const nextIdx = stateManager.getIndex(0, nextOut, t.bases[2], t.bases[1], t.bases[0]);
            const RE_after = (nextOut < 3) ? RE_data[nextIdx][0] : 0;

            actionValue += t.prob * ((RE_after - RE_before) + t.runs);
        }

        // 상황 발생 빈도(weights)를 곱해서 누적
        totalWeightedValue += actionValue * weights[i];
    }

    return totalWeightedValue;
}

function calcRZero(P_zero) {
    const N_zero = createFundamentalMatrix(P_zero, 24);
    const zeroOutProb = P_zero.slice(0, 24).map(row => [row[24]]);

    return getExpectedRewards(N_zero, zeroOutProb);

}

export function calculateRE(
    batterAbility, runnerAbility, transitionEngine) {

    const { P, P_zero, R, R_sq } = matrixBuilder(
        [batterAbility], runnerAbility,
        stateManager, transitionEngine);

    const ret = {}

    const N = createFundamentalMatrix(P, 24);
    ret['R'] = getExpectedRewards(N, R);
    ret['R_zero'] = calcRZero(P_zero);
    ret['variance'] = getVariance(P, N, R, R_sq, ret['R'], 24);
    const fundamentalMatrix = N.toArray();const expectedPAperInning = fundamentalMatrix[0].reduce((sum, val) => sum + val, 0);

    // ... (기존 runValue 및 나머지 로직)
    const actions = ['bb', '1B', '2B', '3B', 'hr', 'so', 'fo', 'go'];
    ret['runValue'] = actions.reduce((acc, action) => {
        const value = getRunValue(action, runnerAbility, transitionEngine, ret['R'], fundamentalMatrix);
        acc[action] = { name: action, value: value };
        return acc;
    }, {});
    
    let expectedOutsPerPA = 0;

    actions.forEach(action => {
        const prob = batterAbility[action]; // 해당 타격 결과가 나올 확률
        // 주자 상황별로 getTransitions를 호출하여 평균 아웃델타를 구함
        // 여기서는 단순화를 위해 '0아웃 주자없음' 기준 혹은 전체 평균을 사용
        const transitions = transitionEngine.getTransitions(action, {out:0, b1:0, b2:0, b3:0}, runnerAbility);
        const avgOutForThisAction = transitions.reduce((sum, t) => sum + (t.prob * t.outDelta), 0);
        
        expectedOutsPerPA += prob * avgOutForThisAction;
    });

    // 3. 기대 타석 수 재계산 (주루사 포함된 아웃 확률 반영)
    const correctedPAperInning = 3 / expectedOutsPerPA;

    // 4. 최종 R/PA (Custom)
    ret['R_PA_Custom'] = ret['R'][0] / correctedPAperInning;

    return ret;

}   