export class Visualizer9RE {

    constructor() {

    }

    bindElement(element) {
        this.element = element;
    }

    setREValue(ret, weights, lgWobaRaw, wOBAScale, runPerPa) {
        
        if (!this.element) return;
        this.element.querySelector('.result-9re').innerHTML =
            this.visualize9RE(ret['R']);

    }

    visualize9RE(RE) {
        return `
                <div class="final-score" style="margin-top: 15px; font-size: 1.2em; font-weight: bold; color: #2c3e50;">
                    <p>⚾ 
                        <e-text key="label-league-expected-runs-per-9-innings">
                            9이닝당 리그 기대 득점
                        </e-text>:
                        <span style="color: #e74c3c;">
                            ${(RE[0][0] * 9).toFixed(3)}
                        </span>
                    </p>
                </div>`;

    }

}