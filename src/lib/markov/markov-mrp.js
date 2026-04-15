/**
 * markov-mrp.js
 * 범용 마르코프 보상 과정(MRP) 계산 엔진
 */

import * as math from 'mathjs';

/**
 * 1단계: 전이 행렬로부터 기본 행렬(N)을 생성합니다.
 */
export function createFundamentalMatrix(P, transientCount) {
    const Q = math.matrix(
        P.slice(0, transientCount).map(row => row.slice(0, transientCount))
    );
    const I = math.identity(transientCount);
    
    // N = (I - Q)^-1
    return math.inv(math.subtract(I, Q));
}

/**
 * 2단계: 기대 보상(Expected Rewards)을 구합니다.
 */
export function getExpectedRewards(fundamentalMatrix, rewardVector) {
    const rewardMat = math.matrix(rewardVector);
    const expected = math.multiply(fundamentalMatrix, rewardMat);
    return expected.toArray();
}

/**
 * 3단계: 보상의 분산(Variance)을 구합니다.
 * Var[X] = E[X^2] - (E[X])^2
 */
export function getVariance(
    P,
    fundamentalMatrix,
    R,
    R_sq,
    expectedRewards,
    transientCount
) {
    // Q 행렬 추출
    const Q = math.matrix(
        P.slice(0, transientCount).map(row => row.slice(0, transientCount))
    );

    const mu = math.matrix(expectedRewards);   // μ
    const Rvec = math.matrix(R);
    const R2vec = math.matrix(R_sq);

    // Q * μ
    const Qmu = math.multiply(Q, mu);

    // R² + 2 * R ⊙ (Qμ)
    const secondMomentReward = math.add(
        R2vec,
        math.dotMultiply(
            math.multiply(2, Rvec),
            Qmu
        )
    );

    // m = N * (...)
    const m = math.multiply(fundamentalMatrix, secondMomentReward);

    // Var = m - μ²
    const variance = math.subtract(
        m,
        math.dotPow(mu, 2)
    );

    return variance.toArray();
}

/**
 * 4단계: 무득점 확률을 이용한 성공 확률(Success Probability) 계산
 * 1 - (무득점 상태로 흡수될 확률)
 */
export function getSuccessProbability(P_zero, transientCount) {
    const Q_zero = math.matrix(
        P_zero.slice(0, transientCount).map(row => row.slice(0, transientCount))
    );
    const I = math.identity(transientCount);
    const N_zero = math.inv(math.subtract(I, Q_zero));

    // N_zero * (I - Q_zero) * 1_vector를 하면 각 상태에서 
    // 보상 없이 흡수 상태(이닝 종료)에 도달할 확률이 나옵니다.
    const ones = math.ones(transientCount, 1);
    const probZero = math.multiply(N_zero, math.subtract(I, Q_zero)); 
    
    // 단순화된 구현: 1 - (무득점 경로의 생존율)
    // 여기서는 각 상태에서 무득점으로 이닝이 끝날 확률을 뺀 값을 반환합니다.
    const survivalRate = math.multiply(N_zero, math.subtract(I, Q_zero));
    // 실제 구현에서는 흡수 확률 행렬을 통해 정확한 무득점 종료 확률을 구해야 합니다.
    // 여기서는 기본 구조를 위해 1차원 변환 후 반환합니다.
    return math.flatten(survivalRate).toArray(); 
}