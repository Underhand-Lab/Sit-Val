export class VisualizerRE {

    constructor() {

    }

    bindElement(element) {
        this.element = element;
        this.startNumSelector = element.querySelector(".start-num");

        this.startNumSelector.addEventListener('change', ()=> {
            this.element.querySelector('.result-re').innerHTML =
                this.visualizeRE(this.ret);
        });

    }

    setREValue(ret) {

        if (!this.element) return;
        
        this.ret = ret;
        this.element.querySelector('.result-re').innerHTML =
            this.visualizeRE(ret);
        
    }

    visualizeRE(ret) {

        const idx = parseInt(this.startNumSelector.value);

        if (!ret['re'][idx]) {
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
            const re_0_out = ret['re'][idx][j].toFixed(3);
            const re_1_out = ret['re'][idx][j + 8].toFixed(3);
            const re_2_out = ret['re'][idx][j + 16].toFixed(3);

            html += `
            <tr>
                <td class="runner-state">${runnerStates[j]}</td>
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

}