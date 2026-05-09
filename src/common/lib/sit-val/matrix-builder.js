/**
 * matrix-builder.js
 * 야구 상황 데이터를 MRP 행렬 구조로 변환
 */
export function matrixBuilder(abilities, runner, stateManager, transitionEngine) {
    
    const N = stateManager.size();

    // 행렬 및 벡터 초기화
    const P = Array(N + 1).fill(0).map(() => Array(N + 1).fill(0));
    const P_zero = Array(N + 1).fill(0).map(() => Array(N + 1).fill(0));
    const R = Array(N).fill(0).map(() => [0]);      // E[R]
    const R_sq = Array(N).fill(0).map(() => [0]);   // E[R^2]
    const R_bin = Array(N).fill(0).map(() => [0]);  // 기대 득점 빈도

    for (let i = 0; i < N; i++) {
        const [b, out, b3, b2, b1] = stateManager.reverseState(i);
        const batter = abilities[b];

        for (const action of Object.keys(batter)) {
            const pAction = batter[action] || 0;
            if (pAction <= 0) continue;

            const transitions = transitionEngine.getTransitions(
                action,
                { out, b1, b2, b3 },
                runner
            );

            for (const t of transitions) {
                const p = pAction * t.prob;
                
                // 다음 상태 인덱스 계산 (아웃 카운트가 3이 되면 N번 인덱스(흡수)로 이동)
                const nextOut = out + t.outDelta;
                let nextIdx;
                
                if (nextOut >= 3) {
                    nextIdx = N; // 이닝 종료 상태
                } else {
                    nextIdx = stateManager.getIndex(
                        stateManager.nextB(b),
                        nextOut,
                        t.bases[2],
                        t.bases[1],
                        t.bases[0]
                    );
                }

                // 1. 전체 전이 행렬
                P[i][nextIdx] += p;

                // 2. 무득점 전용 전이 행렬 (득점이 0일 때만 기록)
                if (t.runs === 0) {
                    P_zero[i][nextIdx] += p;
                }

                // 3. 보상 벡터들
                R[i][0] += p * t.runs;
                R_sq[i][0] += p * (t.runs ** 2);
                R_bin[i][0] += (t.runs > 0) ? p : 0;
            }
        }
    }

    // 흡수 상태(이닝 종료) 설정
    P[N][N] = 1.0;
    P_zero[N][N] = 1.0;

    return { P, P_zero, R, R_sq, R_bin };
}