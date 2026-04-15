function getBigInningProb(mu, variance, k = 1) {
    if (k <= 0) return 1.0; 
    if (mu <= 1e-9) return 0.0;

    // 1. 파라미터 설정
    let prob0; // P(X=0)
    let getNextTerm; // 다음 항을 구하는 함수

    if (variance <= mu + 1e-9) {
        // 포아송 분포 근사 (p = e^-mu * mu^i / i!)
        prob0 = Math.exp(-mu);
        getNextTerm = (currentProb, i) => currentProb * mu / (i + 1);
    } else {
        // 음이항 분포 근사
        const r = (mu * mu) / (variance - mu);
        const p = r / (r + mu);
        const q = 1 - p; // 실패 확률 (여기서는 득점 확률 성분)

        prob0 = Math.pow(p, r); // P(X=0)
        getNextTerm = (currentProb, i) => currentProb * (i + r) / (i + 1) * q;
    }

    // 2. 루프를 통한 누적 (점화식 적용)
    let probLessThanK = 0;
    let currentTermProb = prob0;

    for (let i = 0; i < k; i++) {
        probLessThanK += currentTermProb;
        if (currentTermProb < 1e-15) break;
        currentTermProb = getNextTerm(currentTermProb, i);
    }

    return Math.max(0, Math.min(1, 1 - probLessThanK));
}

export class VisualizerBigInning {

    constructor() {

    }

    bindElement(element) {
        this.element = element;
        this.startNumSelector = element.querySelector(".start-num");
        this.goalRunInput = element.querySelector('.goal-run');

        this.startNumSelector.addEventListener('change', ()=> {
            this.element.querySelector('.result').innerHTML =
                this.visualizeRE(this.ret);
        });

        this.goalRunInput.addEventListener('change', ()=> {
            this.element.querySelector('.result').innerHTML =
                this.visualizeRE(this.ret);
        });

    }

    setREValue(ret) {

        if (!this.element) return;
        
        this.ret = ret;
        this.element.querySelector('.result').innerHTML =
            this.visualizeRE(ret);
        
    }

    visualizeRE(ret) {

        const idx = parseInt(this.startNumSelector.value);
        const goalRun = parseInt(this.goalRunInput.value);

        if (!ret['variance'][idx]) {
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
            const re_0_out = getBigInningProb(
                ret['R'][idx][j],
                ret['variance'][idx][j], goalRun);
            const re_1_out = getBigInningProb(
                ret['R'][idx][j + 8],
                ret['variance'][idx][j + 8], goalRun);
            const re_2_out = getBigInningProb(
                ret['R'][idx][j + 16],
                ret['variance'][idx][j + 16], goalRun);
            

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