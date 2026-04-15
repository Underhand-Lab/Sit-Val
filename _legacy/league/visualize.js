import * as Calc from "../src/lib/sabermetrics/calc.js";
import { VisualizerPersonal } from "./visualizer/visualizer-personal.js";
import { VisualizerLeague } from "./visualizer/visualizer-league.js";
import { VisualizerRunValue } from "./visualizer/visualizer-run-value.js";
import { Visualizer9RE } from "./visualizer/visualizer-9RE.js";
import { VisualizerRE24 } from "./visualizer/visualizer-RE24.js";
import { VisualizerRP24 } from "./visualizer/visualizer-RP24.js";
import { VisualizerBigInning } from "./visualizer/visualizer-big-inning.js";

import { BoxList } from "../src/ui/box-list.js"

let visualizers = [];
let boxList = null;
let toolSelect = null;
let targetRet;
let targetSaber;

export function initLeagueVisualizers() {
    const boxesBase = document.getElementById('boxes');
    if (!boxesBase) return;

    boxList = new BoxList(boxesBase);
    toolSelect = document.querySelector('#tool-select');
    visualizers = [];
    setupEventListeners();

    // 초기 도구 추가
    addDefaultTools();
}

function addToolRaw(src, visualizer) {
    return new Promise((resolve, reject) => {
        boxList.addBoxTemplate(src, () => {
            visualizer = visualizers.filter(vs => vs !== visualizer);
        }, (box) => {
            box.className = 'container neumorphism';

            visualizer.bindElement(box);
            visualizers.push(visualizer);
            apply(visualizer);
            resolve();
        });
    });

}

function addTool(src, visualizer) {
    addToolRaw(src, visualizer).then(() => {
        if (toolSelect && toolSelect.closeAction) toolSelect.closeAction();
        let bottom = document.body.scrollHeight;
        window.scrollTo({ top: bottom, left: 0, behavior: 'smooth' });
    })
}

function setupEventListeners() {
    const btnMap = [
        { id: '#add-visualizer-personal', component: VisualizerPersonal, template: "./template/visualizer-personal.html" },
        { id: '#add-visualizer-league', component: VisualizerLeague, template: "./template/visualizer-league.html" },
        { id: '#add-visualizer-run-value', component: VisualizerRunValue, template: "./template/visualizer-run-value.html" },
        { id: '#add-visualizer-9RE', component: Visualizer9RE, template: "./template/visualizer-9RE.html" },
        { id: '#add-visualizer-RE24', component: VisualizerRE24, template: "./template/visualizer-RE24.html" },
        { id: '#add-visualizer-RP24', component: VisualizerRP24, template: "./template/visualizer-RP24.html" },
        { id: '#add-visualizer-big-inning', component: VisualizerBigInning, template: "./template/visualizer-big-inning.html" }
    ];

    btnMap.forEach(({ id, component, template }) => {
        const btn = document.querySelector(id);
        if (btn) {
            btn.addEventListener('click', () => {
                const instance = new component();
                if (instance.bindBatterPopUp) {
                    instance.bindBatterPopUp(document.getElementById('batter-personal'));
                }
                addTool(template, instance);
            });
        }
    });
}

function apply(visualizer) {
    if (!targetRet) return;
    visualizer.setREValue(targetRet,
        targetSaber.weights, targetSaber.lgWobaRaw,
        targetSaber.wOBAScale, targetSaber.runPerPa);
}

export function visualize(ret, leagueBatter) {
    targetRet = ret;
    targetSaber = {}
    targetSaber.weights = Calc.calculateWeightedRunValue(
        leagueBatter, ret['runValue']);
    targetSaber.lgWobaRaw = Calc.calculateCustomWOBA(
        targetSaber.weights, leagueBatter);
    targetSaber.wOBAScale = 0.33 / targetSaber.lgWobaRaw;
    targetSaber.runPerPa = Calc.calculateLeagueRunPerPA(
        ret['R'][0][0], leagueBatter);

    for (let i = 0; i < visualizers.length; i++) {
        apply(visualizers[i]);
    }
}

function addDefaultTools() {
    addToolRaw("./template/visualizer-9RE.html", new Visualizer9RE())
        .then(() => addToolRaw("./template/visualizer-RE24.html", new VisualizerRE24()))
        .then(() => addToolRaw("./template/visualizer-league.html", new VisualizerLeague()))
        .then(() => {
            const personal = new VisualizerPersonal();
            personal.bindBatterPopUp(document.getElementById('batter-personal'));
            return addToolRaw("./template/visualizer-personal.html", personal);
        })
        .then(() => addToolRaw("./template/visualizer-run-value.html", new VisualizerRunValue()));
}