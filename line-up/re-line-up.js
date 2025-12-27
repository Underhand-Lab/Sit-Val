import { calculate_markov_core } from "/src/re/RE.js";
import * as TransitionEngine from "/src/re/transition-engine/index.js";


const stateManager = {
    getIndex(abilities_len, b_idx, out, b3, b2, b1) {
        if (out >= 3) return abilities_len * 24; // 흡수 상태 (이닝 종료)
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
    }
};

export function calculateLineupRE(lineup_abilities, runner_ability) {
    const ruleEngine = new TransitionEngine.Standard();
    const { P_full, N_data, RE_data, L } =
        calculate_markov_core(lineup_abilities, runner_ability,
            stateManager, ruleEngine);
    const N_size = L * 24;

    // --- [A] 타자별 24개 상황 RE 추출 ---
    const situational_re = [];
    for (let b = 0; b < L; b++) {
        const batter_situations = [];
        for (let out = 0; out < 3; out++) {
            for (let b3 = 0; b3 < 2; b3++) {
                for (let b2 = 0; b2 < 2; b2++) {
                    for (let b1 = 0; b1 < 2; b1++) {
                        const idx = stateManager.getIndex(L, b, out, b3, b2, b1);
                        batter_situations.push(RE_data[idx][0]);
                    }
                }
            }
        }
        situational_re[b] = batter_situations;
    }

    // --- [B] 이닝 전이 행렬 T 생성 ---
    const T = Array(L).fill(0).map(() => Array(L).fill(0));
    for (let b = 0; b < L; b++) {
        const start_node = stateManager.getIndex(L, b, 0, 0, 0, 0);
        for (let i = 0; i < N_size; i++) {
            const prob_to_end = P_full[i][N_size]; // 3아웃 흡수상태 확률
            if (prob_to_end > 0) {
                const [curr_b] = stateManager.reverseState(i);
                const next_leadoff = (curr_b + 1) % L;
                T[b][next_leadoff] += N_data[start_node][i] * prob_to_end;
            }
        }
    }

    // --- [C] 9이닝 타순 연결성 시뮬레이션 ---
    let current_start_dist = new Array(L).fill(0);
    current_start_dist[0] = 1.0; 

    const leadoff_vector = new Array(L).fill(0);
    const pa_vector = new Array(L).fill(0);
    let total_9inning_re = 0;

    for (let inning = 1; inning <= 9; inning++) {
        const next_start_dist = new Array(L).fill(0);
        for (let b = 0; b < L; b++) {
            const prob_b_starts = current_start_dist[b];
            if (prob_b_starts <= 1e-10) continue;

            leadoff_vector[b] += prob_b_starts;
            const start_node = stateManager.getIndex(L, b, 0, 0, 0, 0);
            total_9inning_re += prob_b_starts * RE_data[start_node][0];

            for (let j = 0; j < N_size; j++) {
                const [target_b_idx] = stateManager.reverseState(j);
                pa_vector[target_b_idx] += prob_b_starts * N_data[start_node][j];
            }

            if (inning < 9) {
                for (let next_b = 0; next_b < L; next_b++) {
                    next_start_dist[next_b] += prob_b_starts * T[b][next_b];
                }
            }
        }
        current_start_dist = [...next_start_dist];
    }

    return {
        re: situational_re,           // 타자별 상황 기대 득점표
        pa_vector: pa_vector,         // 9이닝당 기대 타석 수
        leadoff_vector: leadoff_vector, // 9이닝당 선두타자 등장 횟수
        total_re: total_9inning_re    // 경기당 평균 기대 득점
    };
}