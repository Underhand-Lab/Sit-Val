import * as Calc from "../../src/lib/sabermetrics/calc.js";

function round(value, cnt) {
    let c = 1

    for (let i = 0; i < cnt; i++) { c *= 10; }

    return Math.round(value * c) / c;
}

export class VisualizerPersonal {

    constructor() {

    }

    bindElement(element) {
        this.element = element;

        if (!this.batterInputPopUp) return;
        this.buttonSet(this.element,
            this.batterInputPopUp, this.batterInput);

    }

    bindBatterPopUp(batterInputPopUp) {

        this.batterInputPopUp = batterInputPopUp;
        
        this.batterInput = batterInputPopUp.querySelector('batter-input');

        this.batterInput.setAfterBindInput(() => {
            this.ability = this.batterInput.getAbilityRaw();
            if (!this.ret) return;
            this.visualizePersonal(this.ability);
        });

        if (!this.element) return;
        this.buttonSet(this.element,
            this.batterInputPopUp, this.batterInput);
    }

    buttonSet(element, batterInputPopUp, batterInput) {
        const btn = element.querySelector(
            '.open-batter-personal');

        if (!btn) return;

        btn.addEventListener('click', () => {

            batterInputPopUp.openAction();
            if (!this.ability) {
                this.ability = batterInput.getAbilityRaw();
            }

            batterInput.readJson(this.ability);
            batterInput.setEvent(() => {
                this.ability = batterInput.getAbilityRaw();
                if (!this.ret) return;
                this.visualizePersonal(this.ability);
            });
        });
    }

    setREValue(ret, weights, lgWobaRaw, wOBAScale, runPerPa) {
        this.ret = ret;
        this.weights = weights;
        this.lgWobaRaw = lgWobaRaw;
        this.wOBAScale = wOBAScale;
        this.runPerPa = runPerPa;

        if (!this.element) return;
        if (!this.ability) return;
        this.visualizePersonal(this.ability);
    }

    visualizePersonal(batterAbility) {

        const playerWobaRaw = Calc.calculateCustomWOBA(
            this.weights, batterAbility);

        const playerPA = batterAbility['pa'];

        const playerWRAAFromWoba =
            Calc.calculateWRAAPlusFromWoba(
                playerWobaRaw, this.lgWobaRaw, 1, playerPA);
                
        const playerCustomWRAA = Calc.calculateCustomWRAAPlus(
            batterAbility, this.ret['runValue']);

        const wrcPlus = Calc.calculateWRCPlus(
            playerWRAAFromWoba / playerPA, this.runPerPa
        );

        const wrcPlusCustom = Calc.calculateWRCPlus(
            playerCustomWRAA / playerPA, this.ret['R_PA_Custom']
        );

        this.element.querySelector('.personal-woba').innerHTML
            = 
            `<e-text key="label-personal-extended-woba">
                    가중 출루율(wOBA)
            </e-text>: ${(playerWobaRaw * this.wOBAScale).toFixed(3)}`;

        this.element.querySelector('.personal-wraa').innerHTML
            = `wRAA: ${round(playerWRAAFromWoba, 2).toFixed(3)}`;
        this.element.querySelector('.personal-wraa-custom').innerHTML
            = 
            `<e-text key="label-personal-extended-wraa-custom">
                    wRAA(커스텀)
            </e-text>: ${round(playerCustomWRAA, 2).toFixed(3)}`;

        this.element.querySelector('.personal-wrcplus').innerHTML
            = `wRC+: ${round(wrcPlus, 2).toFixed(2)}`;
        this.element.querySelector(
            '.personal-wrcplus-custom').innerHTML =
            `<e-text key="label-personal-extended-wrc+-custom">
                    wRC+(커스텀)
            </e-text>: ${round(wrcPlusCustom, 2).toFixed(2)}`;

    }
}