import * as math from 'mathjs';

/**
 * 1단계: 전이 행렬로부터 기본 행렬(N)을 생성합니다.
 */
export function createFundamentalMatrix(P: number[][], transientCount: number): math.Matrix {
    const Q = math.matrix(
        P.slice(0, transientCount).map(row => row.slice(0, transientCount))
    );
    const I = math.identity(transientCount) as math.Matrix;
    
    // N = (I - Q)^-1
    return math.inv(math.subtract(I, Q)) as math.Matrix;
}

/**
 * 2단계: 기대 보상(Expected Rewards)을 구합니다.
 */
export function getExpectedRewards(fundamentalMatrix: math.Matrix, rewardVector: number[]): number[] {
    const rewardMat = math.matrix(rewardVector);
    const expected = math.multiply(fundamentalMatrix, rewardMat) as math.Matrix;
    return expected.toArray() as number[];
}

/**
 * 3단계: 보상의 분산(Variance)을 구합니다.
 * Var[X] = E[X^2] - (E[X])^2
 */
export function getVariance(
    P: number[][],
    fundamentalMatrix: math.Matrix,
    R: number[],
    R_sq: number[],
    expectedRewards: number[],
    transientCount: number
): number[] {
    // Q 행렬 추출
    const Q = math.matrix(
        P.slice(0, transientCount).map(row => row.slice(0, transientCount))
    );

    const mu = math.matrix(expectedRewards);   // μ
    const Rvec = math.matrix(R);
    const R2vec = math.matrix(R_sq);

    // Q * μ
    const Qmu = math.multiply(Q, mu) as math.Matrix;

    // R² + 2 * R ⊙ (Qμ)
    const secondMomentReward = math.add(
        R2vec,
        math.dotMultiply(
            math.multiply(2, Rvec),
            Qmu
        )
    ) as math.Matrix;

    // m = N * (...)
    const m = math.multiply(fundamentalMatrix, secondMomentReward) as math.Matrix;

    // Var = m - μ²
    const variance = math.subtract(
        m,
        math.dotPow(mu, 2)
    ) as math.Matrix;

    return variance.toArray() as number[];
}

/**
 * 4단계: 무득점 확률을 이용한 성공 확률(Success Probability) 계산
 * 1 - (무득점 상태로 흡수될 확률)
 */
export function getSuccessProbability(P_zero: number[][], transientCount: number): number[] {
    const Q_zero = math.matrix(
        P_zero.slice(0, transientCount).map(row => row.slice(0, transientCount))
    );
    const I = math.identity(transientCount) as math.Matrix;
    const N_zero = math.inv(math.subtract(I, Q_zero)) as math.Matrix;

    // N_zero * (I - Q_zero) * 1_vector를 하면 각 상태에서 
    // 보상 없이 흡수 상태(이닝 종료)에 도달할 확률이 나옵니다.
    // 단순화된 구현: 1 - (무득점 경로의 생존율)
    const survivalRate = math.multiply(N_zero, math.subtract(I, Q_zero)) as math.Matrix;
    return (math.flatten(survivalRate) as math.Matrix).toArray() as number[]; 
}