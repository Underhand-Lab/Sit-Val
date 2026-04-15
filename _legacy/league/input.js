import * as TransitionEngine from "../src/sit-val/transition-engine/index.js";

import { calculateRE } from "./re-league.js";
import { visualize } from "./visualize.js";

const batterInput = document.getElementById('batter-league');
const runnerInput = document.getElementById('runner-league');

const transitionEngine = new TransitionEngine.Standard();

function execute() {

    const batterAbility = batterInput.getAbility();
    const runnerAbility = runnerInput.getAbility();

    const ret = calculateRE(batterAbility,
        runnerAbility, transitionEngine);
        
    visualize(ret, batterInput.getAbilityRaw());

}

batterInput.setAfterBindInput(() => {
    batterInput.setEvent(execute);
    runnerInput.setAfterBindInput(() => {
        runnerInput.setEvent(execute);
        execute();
    });
});