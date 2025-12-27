function visualizeRE(RE_results, idx) {
    if (!RE_results[idx]) {
        return "";
    }

    const runner_states = [
        "주자 없음", "1루", "2루", "3루",
        "1, 2루", "1, 3루", "2, 3루", "만루"
    ];

    let html = `
            <table class="re-table">
                <thead>
                    <tr>
                        <th>주자 상황</th>
                        <th>0 아웃</th>
                        <th>1 아웃</th>
                        <th>2 아웃</th>
                    </tr>
                </thead>
                <tbody>
    `;

    for (let j = 0; j < 8; j++) {
        const re_0_out = RE_results[idx][j].toFixed(3);
        const re_1_out = RE_results[idx][j + 8].toFixed(3);
        const re_2_out = RE_results[idx][j + 16].toFixed(3);

        html += `
            <tr>
                <td class="runner-state">${runner_states[j]}</td>
                <td>${re_0_out}</td>
                <td>${re_1_out}</td>
                <td>${re_2_out}</td>
            </tr>
        `;
    }

    html += `
                </tbody>
            </table>
    `;



    return html;
}

function visualizeLeadoff(leadoffProbVector, idx) {

    // --- 리드오프 등장 확률 섹션 추가 ---
    let html = `
            <table class="leadoff-table">
                <thead>
                    <tr>
                        <th>타순</th>
                        <th>이닝 시작 확률</th>
                        <th>9이닝당 시작 횟수</th>
                    </tr>
                </thead>
                <tbody>
    `;

    for (let i = 0; i < 9; i++) {
        // 현재 선택된 타자(idx)의 행을 강조 표시
        const isSelected = (i === idx) ? 'style="background-color: #f0f7ff; font-weight: bold;"' : '';

        html += `
            <tr ${isSelected}>
                <td>${i + 1}번 타자</td>
                <td>${((leadoffProbVector[i] / 9) * 100).toFixed(2)}%</td>
                <td>${leadoffProbVector[i].toFixed(3)}회</td>
            </tr>
        `;
    }

    html += `
                </tbody>
            </table>
    `;

    return html;
}

function get9RE(RE_results, leadoff_vector, idx) {
    let total_re_9 = 0;

    for (let i = 0; i < 9; i++) {
        total_re_9 += RE_results[i][0] * leadoff_vector[i];
    }

    return `
            <div class="final-score" style="margin-top: 15px; font-size: 1.2em; font-weight: bold; color: #2c3e50;">
                <p>⚾ 9이닝당 팀 기대 득점: <span style="color: #e74c3c;">${total_re_9.toFixed(3)}</span></p>
            </div>
    `;

}

export { visualizeRE, visualizeLeadoff, get9RE };