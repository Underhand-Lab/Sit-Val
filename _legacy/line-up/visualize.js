import { VisualizerLeadoff } from "./visualizer/visualizer-leadoff.js";
import { Visualizer9RE } from "./visualizer/visualizer-9RE.js";
import { VisualizerRE } from "./visualizer/visualizer-RE.js";
import { VisualizerBigInning } from "./visualizer/visualizer-big-inning.js";

import { BoxList } from "../src/ui/box-list.js"

let targetRet;
let visualizers = [];

function apply(visualizer) {

    if (!targetRet) return;

    visualizer.setREValue(targetRet);

}

const boxList = new BoxList(document.getElementById('boxes'));
const toolSelect = document.querySelector('#tool-select');


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
        { id: '#add-visualizer-leadoff', component: VisualizerLeadoff, template: "./template/visualizer-leadoff.html" },
        { id: '#add-visualizer-9RE', component: Visualizer9RE, template: "./template/visualizer-9RE.html" },
        { id: '#add-visualizer-RE', component: VisualizerRE, template: "./template/visualizer-RE.html" },
        { id: '#add-visualizer-big-inning', component: VisualizerBigInning, template: "./template/visualizer-big-inning.html" }
    ];

    btnMap.forEach(({ id, component, template }) => {
        const btn = document.querySelector(id);
        if (btn) {
            btn.addEventListener('click', () => {
                addTool(template, new component());
            });
        }
    });
}

export function visualize(ret) {
    targetRet = ret;
    for (let i = 0; i < visualizers.length; i++) {
        apply(visualizers[i]);
    }
}

function addDefaultTools() {
    addToolRaw("./template/visualizer-9RE.html", new Visualizer9RE())
        .then(() => addToolRaw("./template/visualizer-RE.html", new VisualizerRE()))
        .then(() => addToolRaw("./template/visualizer-leadoff.html", new VisualizerLeadoff()))
        .then(() => addToolRaw("./template/visualizer-big-inning.html", new VisualizerBigInning()));
}