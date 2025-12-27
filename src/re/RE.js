export function calculate_markov_core(abilities, runner, stateManager, engine) {
    const L = abilities.length;
    const N = L * 24;

    const P = Array(N + 1).fill(0).map(() => Array(N + 1).fill(0));
    const R = Array(N).fill(0).map(() => [0]);

    for (let i = 0; i < N; i++) {
        const [b, out, b3, b2, b1] = stateManager.reverseState(i);
        const batter = abilities[b];
        const nextB = (b + 1) % L;

        for (const action of Object.keys(batter)) {
            const pAction = batter[action] || 0;
            if (pAction <= 0) continue;

            const transitions = engine.getTransitions(
                action,
                { out, b1, b2, b3 },
                runner
            );

            for (const t of transitions) {
                const p = pAction * t.prob;
                const nextIdx = stateManager.getIndex(
                    L,
                    nextB,
                    out + t.outDelta,
                    t.bases[2],
                    t.bases[1],
                    t.bases[0]
                );

                P[i][nextIdx] += p;
                R[i][0] += p * t.runs;
            }
        }
    }

    P[N][N] = 1.0; // 흡수 상태

    const Q = math.matrix(P.slice(0, N).map(r => r.slice(0, N)));
    const I = math.identity(N);
    const Nmat = math.inv(math.subtract(I, Q));
    const RE = math.multiply(Nmat, math.matrix(R));

    return {
        P_full: P,
        N_data: Nmat.toArray(),
        RE_data: RE.toArray(),
        L
    };
}
