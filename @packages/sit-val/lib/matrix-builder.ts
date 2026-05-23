import { RunnerStats } from '../types/RunnerStats';
import { ActionType, ITransitionEngine, Transition } from './transition-engine/types';

export interface StateManager {
    size(): number;
    /** @returns [batterIndex, out, b3, b2, b1] */
    reverseState(index: number): [number, number, number, number, number];
    nextB(b: number): number;
    getIndex(b: number, out: number, b3: number, b2: number, b1: number): number;
}

export interface MatrixBuilderResult {
    P: number[][];
    P_zero: number[][];
    R: number[][];
    R_sq: number[][];
    R_bin: number[][];
}

/**
 * matrix-builder.ts
 * 야구 상황 데이터를 MRP 행렬 구조로 변환
 */
export function matrixBuilder(
    abilities: Record<string, number>[], // 각 타자의 Action별 확률 맵 배열
    runner: RunnerStats,
    stateManager: StateManager,
    transitionEngine: ITransitionEngine
): MatrixBuilderResult {
    
    const N = stateManager.size();

    // 행렬 및 벡터 초기화 (상태 개수 N + 흡수 상태 1개 = N+1)
    const P: number[][] = Array(N + 1).fill(0).map(() => Array(N + 1).fill(0));
    const P_zero: number[][] = Array(N + 1).fill(0).map(() => Array(N + 1).fill(0));
    
    // 보상 벡터 (N x 1)
    const R: number[][] = Array(N).fill(0).map(() => [0]);      // E[R]
    const R_sq: number[][] = Array(N).fill(0).map(() => [0]);   // E[R^2]
    const R_bin: number[][] = Array(N).fill(0).map(() => [0]);  // 기대 득점 빈도 (P(R>0))

    for (let i = 0; i < N; i++) {
        const [b, out, b3, b2, b1] = stateManager.reverseState(i);
        const batter = abilities[b];

        for (const action of Object.keys(batter) as ActionType[]) {
            const pAction = batter[action] || 0;
            if (pAction <= 0) continue;

            const transitions: Transition[] = transitionEngine.getTransitions(
                action,
                { out, b1, b2, b3 },
                runner
            );

            for (const t of transitions) {
                const p = pAction * t.prob;
                
                // 다음 상태 인덱스 계산 (아웃 카운트가 3이 되면 N번 인덱스(흡수)로 이동)
                const nextOut = out + t.outDelta;
                let nextIdx: number;
                
                if (nextOut >= 3) {
                    nextIdx = N; // 이닝 종료 상태 (흡수 상태)
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