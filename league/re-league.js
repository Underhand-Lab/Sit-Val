import { calculate_markov_core } from "/src/re/RE.js";

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

export function calculateRE(
    batterAbility, runnerAbility, transitionEngine) {
    
    return calculate_markov_core([batterAbility], runnerAbility,
        stateManager, transitionEngine);
    
}