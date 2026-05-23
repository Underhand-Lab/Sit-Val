import { createFundamentalMatrix, getExpectedRewards, getVariance } 
    from "@sit-val/lib/markov/markov-mrp";
import { matrixBuilder, StateManager } from "@sit-val/lib/matrix-builder";
import { ActionType, ITransitionEngine } from "@sit-val/lib/transition-engine/types";
import { RunnerStats } from "@sit-val/types/RunnerStats";

const stateManager: StateManager = {
    getIndex(b_idx: number, out: number, b3: number, b2: number, b1: number): number {
        if (out >= 3) return 24; // 흡수 상태 (이닝 종료 인덱스)
        // 타자 수에 따라 24 또는 216 상태로 자동 매핑
        return (b_idx * 24) + (out * 8) + (b3 * 4) + (b2 * 2) + b1;
    },

    reverseState(idx: number): [number, number, number, number, number] {
        const b_idx = Math.floor(idx / 24);
        const rem = idx % 24;
        const out = Math.floor(rem / 8);
        const b_rem = rem % 8;
        const b3 = Math.floor(b_rem / 4);
        const b2 = Math.floor((b_rem % 4) / 2);
        const b1 = b_rem % 2;
        return [b_idx, out, b3, b2, b1];
    },

    nextB(b: number): number {
        return 0;
    },

    size(): number {
        return 24;
    }
};

function getSituationWeights(N_data: number[][]): number[] {
    // 1번 타자(0), 0아웃, 무주자 상태에서 시작하는 행을 찾습니다.
    // N_data[i][j]는 i에서 시작해 j에 머무는 횟수의 기댓값입니다.
    const startNodeIdx = 0; // 보통 첫 번째 상태가 0아웃 무주자입니다.
    const expectedVisits = N_data[startNodeIdx];

    const situationWeights = Array(24).fill(0);
    for (let j = 0; j < expectedVisits.length; j++) {
        const situationIdx = j % 24; // 타순을 무시하고 24개 상황으로 압축
        situationWeights[situationIdx] += expectedVisits[j];
    }

    // 전체 합으로 나누어 비중(Probability)으로 변환
    const total = situationWeights.reduce((a, b) => a + b, 0);
    return situationWeights.map(v => v / total);

}

/**
 * 특정 액션(안타, 볼넷 등)의 기대 득점 가치(Run Value)를 계산합니다.
 */
function getRunValue(
    action: ActionType, 
    runnerAbility: RunnerStats, 
    engine: ITransitionEngine,
    RE_data: number[], 
    N_data: number[][]
): number {
    let totalWeightedValue = 0;
    const weights = getSituationWeights(N_data);

    for (let i = 0; i < 24; i++) {
        // 상황별 전이 결과 가져오기
        const state = stateManager.reverseState(i);
        const stateObj = { out: state[1], b3: state[2], b2: state[3], b1: state[4] };
        const transitions = engine.getTransitions(action, stateObj, runnerAbility);

        // 해당 상황에서의 RE24 가치 계산
        let actionValue = 0;
        const RE_before = RE_data[i];

        for (const t of transitions) {
            const nextOut = stateObj.out + t.outDelta;
            const nextIdx = stateManager.getIndex(0, nextOut, t.bases[2], t.bases[1], t.bases[0]);
            const RE_after = (nextOut < 3) ? RE_data[nextIdx] : 0;

            actionValue += t.prob * ((RE_after - RE_before) + t.runs);
        }

        // 상황 발생 빈도(weights)를 곱해서 누적
        totalWeightedValue += actionValue * weights[i];
    }

    return totalWeightedValue;
}

function calcRZero(P_zero: number[][]): number[] {
    const N_zero = createFundamentalMatrix(P_zero, 24);
    // 이닝 종료 상태(인덱스 24)로 전이될 확률 추출
    const zeroOutProb = P_zero.slice(0, 24).map(row => row[24]);

    return getExpectedRewards(N_zero, zeroOutProb);
}

export interface RECalculationResult {
    R: number[];
    R_zero: number[];
    variance: number[];
    runValue: Record<string, { name: string; value: number }>;
    R_PA_Custom: number;
}

/**
 * 리그 평균 타자와 주자 능력을 바탕으로 기대 득점 행렬 및 지표를 계산합니다.
 */
export function calculateRE(
    batterAbility: Record<string, number>, 
    runnerAbility: RunnerStats, 
    transitionEngine: ITransitionEngine
): RECalculationResult {

    const { P, P_zero, R, R_sq } = matrixBuilder(
        [batterAbility], runnerAbility,
        stateManager, transitionEngine);

    const N_mat = createFundamentalMatrix(P, 24);
    
    // matrixBuilder에서 생성된 R, R_sq는 [N][1] 형태이므로 1차원 배열로 변환
    const R_flat = R.map(r => r[0]);
    const R_sq_flat = R_sq.map(r => r[0]);

    const RE = getExpectedRewards(N_mat, R_flat);
    const R_zero = calcRZero(P_zero);
    const variance = getVariance(P, N_mat, R_flat, R_sq_flat, RE, 24);
    
    const fundamentalMatrix = N_mat.toArray() as number[][];

    const actions: ActionType[] = ['bb', '1B', '2B', '3B', 'hr', 'so', 'fo', 'go'];
    const runValue = actions.reduce((acc, action) => {
        const value = getRunValue(action, runnerAbility, transitionEngine, RE, fundamentalMatrix);
        acc[action] = { name: action, value: value };
        return acc;
    }, {} as Record<string, { name: string; value: number }>);
    
    let expectedOutsPerPA = 0;

    actions.forEach(action => {
        const prob = batterAbility[action] || 0;
        const transitions = transitionEngine.getTransitions(action, {out:0, b1:0, b2:0, b3:0}, runnerAbility);
        const avgOutForThisAction = transitions.reduce((sum, t) => sum + (t.prob * t.outDelta), 0);
        
        expectedOutsPerPA += prob * avgOutForThisAction;
    });

    // 3. 기대 타석 수 재계산 (주루사 포함된 아웃 확률 반영)
    const correctedPAperInning = 3 / expectedOutsPerPA;

    return {
        R: RE,
        R_zero,
        variance,
        runValue,
        R_PA_Custom: RE[0] / correctedPAperInning
    };
}