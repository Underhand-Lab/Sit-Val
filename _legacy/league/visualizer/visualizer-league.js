export class VisualizerLeague {

    constructor() {

    }

    bindElement(element) {
        this.element = element;
    }

    setREValue(ret, weights, lgWobaRaw, wOBAScale, runPerPa) {

        if (!this.element) return;
        
        this.element.querySelector('.league-woba-scale').innerHTML
            = `wOBA Scale: ${wOBAScale.toFixed(3)}`;
        this.element.querySelector('.league-p-pa').innerHTML
            = `R/PA: ${runPerPa.toFixed(3)}`;
        this.element.querySelector('.league-p-pa-custom').innerHTML
            = `R/PA(Custom): ${ret['R_PA_Custom'].toFixed(3)}`;

    }

}