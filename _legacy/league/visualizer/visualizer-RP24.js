export class VisualizerRP24 {

    constructor() {

    }

    bindElement(element) {
        this.element = element;
    }

    setREValue(ret, weights, lgWobaRaw, wOBAScale, runPerPa) {

        if (!this.element) return;

        this.element.querySelector('.result-re24').innerHTML =
            this.visualizeRE24(ret['R_zero']);

    }

    visualizeRE24(R_zero) {
        if (!R_zero) {
            // 오류 메시지는 solve_absorbing_chain_equation에서 이미 처리됨
            return "";
        }

        const runnerStates = [
            '<e-text key="label-runner-state-no">주자 없음</e-text>',
            '<e-text key="label-runner-state-r1">1루</e-text>',
            '<e-text key="label-runner-state-r2">2루</e-text>',
            '<e-text key="label-runner-state-r3">3루</e-text>',
            '<e-text key="label-runner-state-r1-r2">1, 2루</e-text>',
            '<e-text key="label-runner-state-r1-r3">1, 3루</e-text>',
            '<e-text key="label-runner-state-r2-r3">2, 3루</e-text>',
            '<e-text key="label-runner-state-r1-r2-r3">만루</e-text>'
        ];

        let html = `
            <table class="re-table">
                <thead>
                    <tr>
                        <th>
                            <e-text key="label-runner-state">
                                주자 상태
                            </e-text>
                        </th>
                        <th><e-text key="label-out-0">0 아웃</e-text></th>
                        <th><e-text key="label-out-1">1 아웃</e-text></th>
                        <th><e-text key="label-out-2">2 아웃</e-text></th>
                    </tr>
                </thead>
                <tbody>
        `;

        for (let j = 0; j < 8; j++) {
            const re_0_out = (1 - R_zero[j][0]);
            const re_1_out = (1 - R_zero[j + 8][0]);
            const re_2_out = (1 - R_zero[j + 16][0]);

            html += `
            <tr>
                <td class="runner-state">${runnerStates[j]}</td>
                <td>${(re_0_out * 100).toFixed(2)}%</td>
                <td>${(re_1_out * 100).toFixed(2)}%</td>
                <td>${(re_2_out * 100).toFixed(2)}%</td>
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