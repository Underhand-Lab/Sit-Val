import { createFundamentalMatrix, getExpectedRewards, getVariance }
    from "@sit-val/lib/markov/markov-mrp.js";

import { matrixBuilder } from "@sit-val/lib/matrix-builder.js";
import * as TransitionEngine from "@sit-val/lib/transition-engine/index.js";


const stateManager = {
    getIndex(b_idx, out, b3, b2, b1) {
        if (out >= 3) return 216; // 흡수 상태 (이닝 종료)
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
        return (b + 1) % 9;
    },

    size() {
        return 216;
    }
};

export function calculateLineupRE(lineup_abilities, runner_ability) {
    const transitionEngine = new TransitionEngine.Standard();
    const { P, R, R_sq } = matrixBuilder(
        lineup_abilities,
        runner_ability,
        stateManager,
        transitionEngine
    );

    const L = 9;
    const N_SIZE = 216;
    const END_STATE = N_SIZE;

    const N_mat = createFundamentalMatrix(P, N_SIZE);
    const RE = getExpectedRewards(N_mat, R);
    const variance = getVariance(P, N_mat, R, R_sq, RE, 216);

    const N = N_mat.toArray();

    /* ================================
     * [0] 상태 캐싱
     * ================================ */
    const batterIndexOfState = new Array(N_SIZE);
    for (let i = 0; i < N_SIZE; i++) {
        batterIndexOfState[i] = stateManager.reverseState(i)[0];
    }

    /* ================================
     * [A] 타자별 24상황 RE
     * ================================ */
    const situational_re = Array.from({ length: L }, () => []);
    const situational_variance = Array.from({ length: L }, () => []);

    for (let b = 0; b < L; b++) {
        for (let out = 0; out < 3; out++) {
            for (let b3 = 0; b3 < 2; b3++) {
                for (let b2 = 0; b2 < 2; b2++) {
                    for (let b1 = 0; b1 < 2; b1++) {
                        const idx = stateManager.getIndex(b, out, b3, b2, b1);
                        situational_re[b].push(RE[idx][0]);
                        situational_variance[b].push(variance[idx][0]);
                    }
                }
            }
        }
    }

    /* ================================
     * [B] 이닝 전이 행렬 T
     * ================================ */
    const T = Array.from({ length: L }, () => Array(L).fill(0));

    for (let b = 0; b < L; b++) {
        const startNode = stateManager.getIndex(b, 0, 0, 0, 0);

        for (let i = 0; i < N_SIZE; i++) {
            const probEnd = P[i][END_STATE];
            if (probEnd === 0) continue;

            const currBatter = batterIndexOfState[i];
            const nextLeadoff = (currBatter + 1) % L;

            T[b][nextLeadoff] += N[startNode][i] * probEnd;
        }
    }

    /* ================================
     * [C] 9이닝 시뮬레이션
     * ================================ */
    let currentStartDist = new Array(L).fill(0);
    currentStartDist[0] = 1.0;

    const leadoff_vector = new Array(L).fill(0);
    const pa_vector = new Array(L).fill(0);

    let totalRE = 0;

    for (let inning = 1; inning <= 9; inning++) {
        const nextStartDist = new Array(L).fill(0);

        for (let b = 0; b < L; b++) {
            const pStart = currentStartDist[b];
            if (pStart <= 1e-10) continue;

            leadoff_vector[b] += pStart;

            const startNode = stateManager.getIndex(b, 0, 0, 0, 0);
            totalRE += pStart * RE[startNode][0];

            const N_row = N[startNode];
            for (let j = 0; j < N_SIZE; j++) {
                pa_vector[batterIndexOfState[j]] += pStart * N_row[j];
            }

            if (inning < 9) {
                const T_row = T[b];
                for (let nextB = 0; nextB < L; nextB++) {
                    nextStartDist[nextB] += pStart * T_row[nextB];
                }
            }
        }

        currentStartDist = nextStartDist;
    }

    return {
        R: situational_re,
        variance: situational_variance,
        pa_vector,
        leadoff_vector,
        total_re: totalRE
    };
}
