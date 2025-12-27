// rule-engine/RuleEngine.js
class TransitionEngineV3 {

    /**
     * @param {Array} transitions - 타석 결과로 생성된 전이 배열
     * @param {Object} r - 확률 파라미터 객체
     * @param {number} currentOut - 현재 상태의 아웃 카운트
     */
    applyBasestealing(transitions, r, currentOut) {
        const finalTransitions = [];

        transitions.forEach(t => {
            const [b1, b2, b3] = t.bases;
            
            // 도루 가능 상황 체크:
            // 1. 타석 결과 후 1루에 주자가 있고 2루가 비어있음
            // 2. 타석 결과 후 아웃 카운트가 3 미만 (이닝이 끝나지 않음)
            const totalOutsAfterAction = currentOut + t.outDelta;

            if (b1 && !b2 && totalOutsAfterAction < 3) {
                const p_sb = r['s_r1_r2_safe'] || 0; 
                const p_cs = r['s_r1_r2_out'] || 0; 
                const p_no_attempt = 1 - p_sb - p_cs;

                // 1. 도루 시도 안 함
                finalTransitions.push({
                    ...t,
                    prob: t.prob * p_no_attempt
                });

                // 2. 도루 성공 (1루 주자 -> 2루)
                finalTransitions.push({
                    ...t,
                    prob: t.prob * p_sb,
                    bases: [0, 1, b3]
                });

                // 3. 도루 실패 (1루 주자 삭제, outDelta 증가)
                finalTransitions.push({
                    ...t,
                    prob: t.prob * p_cs,
                    outDelta: t.outDelta + 1,
                    bases: [0, 0, b3] // b2는 원래 비어있었으므로 1루 주자만 제거
                });
            } else {
                // 도루 상황이 아니면 원본 유지
                finalTransitions.push(t);
            }
        });

        return finalTransitions;
    }

    getTransitions(action, state, r) {
        const { out, b1, b2, b3 } = state;
        const T = [];

        switch (action) {

            /* =====================
               BB : 볼넷
            ===================== */
            case 'bb': {
                let nb1 = 1, nb2 = b2, nb3 = b3;
                let runs = 0;

                if (b1) {
                    if (b2) {
                        if (b3) runs = 1;
                        else nb3 = 1;
                    } else nb2 = 1;
                }

                T.push({ prob: 1, outDelta: 0, bases: [nb1, nb2, nb3], runs });
                break;
            }

            /* =====================
               SO : 삼진
            ===================== */
            case 'so':
                T.push({ prob: 1, outDelta: 1, bases: [b1, b2, b3], runs: 0 });
                break;

            /* =====================
               FB : 뜬공 (희생플라이)
            ===================== */
            case 'fo':
                if (b3 && out < 2) {
                    // 3루 주자 잔류
                    T.push({
                        prob: r['fo_r3_r3_safe'],
                        outDelta: 1,
                        bases: [b1, b2, 1],
                        runs: 0
                    });
                    // 희생플라이 성공
                    T.push({
                        prob: r['fo_r3_home_safe'],
                        outDelta: 1,
                        bases: [b1, b2, 0],
                        runs: 1
                    });
                    // 희생플라이 실패 (아웃 2개)
                    T.push({
                        prob: r['fo_r3_home_out'],
                        outDelta: 2,
                        bases: [b1, b2, 0],
                        runs: 0
                    });
                } else {
                    T.push({
                        prob: 1,
                        outDelta: 1,
                        bases: [b1, b2, b3],
                        runs: 0
                    });
                }
                break;

            /* =====================
               GB : 땅볼 (병살 포함)
            ===================== */
            case 'go':
                if (b1 && out < 2) {
                    // 병살 분기
                    const p_normal = 1 -r['go_r1_r2_out'] - r['go_b_r1_out'];

                    // 2루 송구
                    T.push({
                        prob: r['go_r1_r2_out'],
                        outDelta: 1,
                        bases: [1, 0, b2],
                        runs: b3 ? 1 : 0
                    });

                    // 1루 송구
                    T.push({
                        prob: r['go_b_r1_out'],
                        outDelta: 1,
                        bases: [0, 1, b2],
                        runs: b3 ? 1 : 0
                    });

                    // 일반 병살
                    T.push({
                        prob: p_normal,
                        outDelta: 2,
                        bases: [0, b2, b3],
                        runs: b3 && out == 0 ? 1: 0
                    });
                } else {
                    T.push({
                        prob: 1,
                        outDelta: 1,
                        bases: [0, b1, b2],
                        runs: (b3 && out < 2) ? 1 : 0
                    });
                }
                break;

            /* =====================
               SH : 단타
            ===================== */
            case '1B':
                if (b2) {
                    // 2루 주자 홈 성공
                    T.push({
                        prob: r['1B_r2_home_safe'],
                        outDelta: 0,
                        bases: [1, b1, 0],
                        runs: b3 + 1
                    });
                    // 2루 주자 홈 실패
                    T.push({
                        prob: r['1B_r2_home_out'],
                        outDelta: 1,
                        bases: [1, b1, 0],
                        runs: b3
                    });
                    // 2루 주자 3루
                    T.push({
                        prob: r['1B_r2_r3_safe'],
                        outDelta: 0,
                        bases: [1, b1, 1],
                        runs: b3
                    });
                } else if (b1) {
                    // 1루 → 3루
                    T.push({
                        prob: r['1B_r1_r3_safe'],
                        outDelta: 0,
                        bases: [1, 0, 1],
                        runs: b3
                    });
                    // 1루 → 2루
                    T.push({
                        prob: r['1B_r1_r3_out'],
                        outDelta: 1,
                        bases: [1, 0, 0],
                        runs: b3
                    });
                    // 1루 → 2루
                    T.push({
                        prob: r['1B_r1_r2_safe'],
                        outDelta: 0,
                        bases: [1, 1, 0],
                        runs: b3
                    });
                } else {
                    // 주자 없음
                    T.push({
                        prob: 1,
                        outDelta: 0,
                        bases: [1, 0, 0],
                        runs: b3
                    });
                }
                break;

            /* =====================
               DH : 2루타
            ===================== */
            case '2B':
                if (b1) {
                    // 1루 주자 홈 성공 (득점: 2루/3루 주자 + 1루 주자)
                    T.push({
                        prob: r['2B_r1_home_safe'],
                        outDelta: 0,
                        bases: [0, 1, 0],
                        runs: b2 + b3 + 1
                    });
                    // 1루 주자 홈 실패 (아웃 증가, 득점: 2루/3루 주자만)
                    T.push({
                        prob: r['2B_r1_home_out'],
                        outDelta: 1,
                        bases: [0, 1, 0],
                        runs: b2 + b3
                    });
                    // 1루 주자 3루 안착 (득점: 2루/3루 주자)
                    T.push({
                        prob: r['2B_r1_r3_safe'],
                        outDelta: 0,
                        bases: [0, 1, 1],
                        runs: b2 + b3
                    });
                } else {
                    // 1루에 주자가 없는 경우 (일반적인 2루타)
                    T.push({
                        prob: 1,
                        outDelta: 0,
                        bases: [0, 1, 0],
                        runs: b2 + b3
                    });
                }
                break;

            /* =====================
               TH : 3루타
            ===================== */
            case '3B':
                T.push({
                    prob: 1,
                    outDelta: 0,
                    bases: [0, 0, 1],
                    runs: b1 + b2 + b3
                });
                break;

            /* =====================
               HR : 홈런
            ===================== */
            case 'hr':
                T.push({
                    prob: 1,
                    outDelta: 0,
                    bases: [0, 0, 0],
                    runs: 1 + b1 + b2 + b3
                });
                break;
        }

        return this.applyBasestealing(T, r, out);
    }
}

export { TransitionEngineV3 };
