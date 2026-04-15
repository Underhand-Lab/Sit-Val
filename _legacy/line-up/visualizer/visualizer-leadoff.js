export class VisualizerLeadoff {

    constructor() {

    }

    bindElement(element) {
        this.element = element;
    }

    setREValue(ret) {

        if (!this.element) return;

        this.element.querySelector('.result-leadoff').innerHTML =
            this.visualizeLeadoff(ret);

    }

    visualizeLeadoff(ret) {

        // --- 리드오프 등장 확률 섹션 추가 ---
        let html = `
            <table class="leadoff-table">
                <thead>
                    <tr>
                        <th>
                            <e-text key="label-batting-order">
                                타순
                            </e-text>
                        </th>
                        <th>
                            <e-text key="label-start-probability">
                                시작 확률
                            </e-text>
                        </th>
                        <th>
                            <e-text key="label-number-of-starts">
                                시작 횟수
                            </e-text>
                        </th>
                    </tr>
                </thead>
                <tbody>
    `;

        for (let i = 0; i < 9; i++) {
            // 현재 선택된 타자(idx)의 행을 강조 표시

            html += `
                <tr>
                    <td>
                        <e-text key="label-batter-num-${i + 1}">
                            ${i + 1}번 타자
                        </e-text>
                    </td>
                    <td>
                        ${((ret['leadoff_vector'][i] / 9) * 100).toFixed(2)}%
                    </td>
                    <td>${ret['leadoff_vector'][i].toFixed(3)}
                        <e-text key="label-times">
                            회
                        </e-text>
                    </td>
                </tr>
            `;
        }

        html += `
            </tbody>
        </table>
        `;

        return html;
    }

}