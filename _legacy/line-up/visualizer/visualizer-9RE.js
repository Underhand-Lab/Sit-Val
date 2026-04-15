export class Visualizer9RE {

    constructor() {

    }

    bindElement(element) {
        this.element = element;
    }

    setREValue(ret) {

        if (!this.element) return;

        this.element.querySelector('.result-9re').innerHTML =
            this.visualize9RE(ret);

    }

    visualize9RE(ret) {
        let total_re_9 = 0;

        for (let i = 0; i < 9; i++) {
            total_re_9 += ret['R'][i][0] * ret['leadoff_vector'][i];
        }

        return `
            <div class="final-score" style="margin-top: 15px; font-size: 1.2em; font-weight: bold; color: #2c3e50;">
                <p>⚾ 
                    <e-text key="label-team-expected-runs-per-9-innings">
                        9이닝당 팀 기대 득점
                    </e-text>:
                    <span style="color: #e74c3c;">
                        ${total_re_9.toFixed(3)}
                    </span>
                </p>
            </div>
        `;

    }

}