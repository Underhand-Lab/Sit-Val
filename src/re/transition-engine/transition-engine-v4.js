// rule-engine/RuleEngine.js
class TransitionEngineV4 {

    /**
     * 3루 도루 처리 (2루 주자 -> 3루)
     */
    applyStealToThird(transitions, r, currentOut) {
        const next = [];
        transitions.forEach(t => {
            const [b1, b2, b3] = t.bases;
            const totalOuts = currentOut + t.outDelta;

            if (b2 && !b3 && totalOuts < 3) {
                const p_sb = r['s_r2_r3_safe'] || 0;
                const p_cs = r['s_r2_r3_out'] || 0;
                const p_no = 1 - p_sb - p_cs;

                if (p_no > 0) next.push({ ...t, prob: t.prob * p_no });
                if (p_sb > 0) next.push({ ...t, prob: t.prob * p_sb, bases: [b1, 0, 1] });
                if (p_cs > 0) next.push({ ...t, prob: t.prob * p_cs, outDelta: t.outDelta + 1, bases: [b1, 0, 0] });
            } else {
                next.push(t);
            }
        });
        return next;
    }

    /**
     * 2루 도루 처리 (1루 주자 -> 2루)
     */
    applyStealToSecond(transitions, r, currentOut) {
        const next = [];
        transitions.forEach(t => {
            const [b1, b2, b3] = t.bases;
            const totalOuts = currentOut + t.outDelta;

            if (b1 && !b2 && totalOuts < 3) {
                const p_sb = r['s_r1_r2_safe'] || 0;
                const p_cs = r['s_r1_r2_out'] || 0;
                const p_no = 1 - p_sb - p_cs;

                if (p_no > 0) next.push({ ...t, prob: t.prob * p_no });
                if (p_sb > 0) next.push({ ...t, prob: t.prob * p_sb, bases: [0, 1, b3] });
                if (p_cs > 0) next.push({ ...t, prob: t.prob * p_cs, outDelta: t.outDelta + 1, bases: [0, 0, b3] });
            } else {
                next.push(t);
            }
        });
        return next;
    }

    /**
     * 도루 시뮬레이션 메인 래퍼
     * 순서: 3루 도루 시도 -> 2루 도루 시도 -> (2루 도루 성공 주자의) 3루 도루 시도
     */
    applyBasestealing(transitions, r, currentOut) {
        let res = transitions;
        res = this.applyStealToThird(res, r, currentOut);  // 기존 2루 주자 처리
        res = this.applyStealToSecond(res, r, currentOut); // 1루 주자 처리 (2루 비었을 때)
        res = this.applyStealToThird(res, r, currentOut);  // 2루로 온 주자의 추가 3루 도루 시도
        return res;
    }
    applyPassedBall(transitions, r, currentOut) {
        const p_pb = r['passedball'] || 0;

        // 폭투 확률이 0이거나 너무 낮으면 계산 낭비를 방지하기 위해 즉시 반환
        if (p_pb <= 0) return transitions;

        const processTransitions = (tList, depth = 0) => {
            // 무한 루프 방지 (한 타석에서 폭투가 3번 이상 일어날 확률은 무시 가능)
            if (depth > 2) return tList;

            const nextLevel = [];
            let hasNewPB = false;

            tList.forEach(t => {
                const [b1, b2, b3] = t.bases;
                const totalOuts = currentOut + t.outDelta;
                const hasRunner = b1 || b2 || b3;

                // 1. 주자가 있고 이닝이 끝나지 않았을 때만 폭투 가능
                if (hasRunner && totalOuts < 3) {
                    const p_no = 1 - p_pb;

                    // 폭투 미발생 상태 유지
                    nextLevel.push({ ...t, prob: t.prob * p_no });

                    // 폭투 발생 (모든 주자 1베이스 진루)
                    const newBases = [0, b1, b2];
                    const newRuns = t.runs + b3;

                    nextLevel.push({
                        ...t,
                        prob: t.prob * p_pb,
                        bases: newBases,
                        runs: newRuns,
                        isPB: true // 연속 발생 체크를 위한 플래그
                    });
                    hasNewPB = true;
                } else {
                    // 주자가 없으면 폭투 발생 없이 그대로 통과
                    nextLevel.push(t);
                }
            });

            // 이번 턴에 폭투가 발생한 전이가 있다면, 그 전이들에 대해서만 한 번 더 계산
            if (hasNewPB) {
                const pbOccurred = nextLevel.filter(n => n.isPB);
                const noPBLocally = nextLevel.filter(n => !n.isPB);

                // PB가 발생한 상태들에 대해서만 재귀 호출 (플래그 삭제 후 진행)
                const afterNextPB = processTransitions(
                    pbOccurred.map(p => { delete p.isPB; return p; }),
                    depth + 1
                );

                return [...noPBLocally, ...afterNextPB];
            }

            return nextLevel;
        };

        return processTransitions(transitions);
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
                    const p_normal = 1 - r['go_r1_r2_out'] - r['go_b_r1_out'];

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
                        runs: b3 && out == 0 ? 1 : 0
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

        const applyedSteal = this.applyBasestealing(T, r, out);
        const applyedPassedball = this.applyPassedBall(applyedSteal, r, out)

        return applyedPassedball;
    }
}

export { TransitionEngineV4 };
