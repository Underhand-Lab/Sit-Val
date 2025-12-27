import { downloadCSV, readCSV } from "/src/csv/download.js"
import { BoxList } from "/src/ui/box-list.js";
import { BatterInput } from "/src/re/input/batter-input-component.js"

import { calculateLineupRE } from "./re-line-up.js"
import { PlayerList } from "./player-list.js"
import { setLineup, getLineup } from "./line-up.js"
import { visualizeRE, visualizeLeadoff, get9RE } from "./visualize.js";

const boxList = new BoxList(document.getElementById("boxes"));
const playerList = new PlayerList();
const lineupBox = document.getElementById("line-up");

const batter = document.getElementById('batter-input');
const runner = document.getElementById('runner-input');

let target;
let targetName;

let ret
let leadoffVector;

function batterAbilityChanged() {
    const newValue = batter.getAbilityRaw();

    for (const key in newValue) {
        target[key] = newValue[key];
    }

    targetName.innerHTML = target['name'];

}

function execute() {

    const input_lineup = getLineup(lineupBox, (b) => {
        return BatterInput.convertToRatio(b);
    });

    const runner_ability = runner.getAbility();

    const retval = calculateLineupRE(input_lineup, runner_ability);

    ret = retval['re'];
    leadoffVector = retval['leadoff_vector'];

    const idx = parseInt(startNumSelector.value);

    document.getElementById('result-re').innerHTML =
        visualizeRE(ret, idx);
    document.getElementById('result-leadoff').innerHTML =
        visualizeLeadoff(leadoffVector, idx);
    document.getElementById('result-9re').innerHTML =
        get9RE(ret, leadoffVector, idx);

}

const addBatterBtn = document.getElementById("add-batter-btn");

function addBatter(refAbility) {

    const newPlayer = Object.assign({}, refAbility);
    playerList.addPlayer(newPlayer, () => { });

    return new Promise((resolve, reject) => {
        boxList.addBoxTemplate("./template/batter-new.html", () => {
            playerList.removePlayer(newPlayer);
            setLineup(lineupBox, playerList.getAllPlayers(), execute);
            execute();
        }, (box)=> {
            box.style.position = 'relative';
            const playerName = box.getElementsByClassName('name')[0];
            playerName.innerHTML = newPlayer['name'];

            const btn = box.getElementsByClassName('edit-player')[0];
            btn.addEventListener('click', () => {
                target = newPlayer;
                targetName = playerName;
                batter.readJson(newPlayer);
                batterEditDiv.setAttribute('open', 'open');

            });
            
        }).then(() => {
            resolve();
        }).catch((error) => {
            console.error(`타자 생성 중 오류가 발생했습니다.: ${error}`);
            reject();
        });

    });
}


const batterEditDiv = document.getElementById('batter-pop-up');
batterEditDiv.addCloseEvent(() => {
    execute();
});

let defaultBatterAbility;

batter.setAfterBindInput(() => {
    batter.setEvent(batterAbilityChanged);
    runner.setAfterBindInput(() => {
        defaultBatterAbility = batter.getAbilityRaw();
        runner.setEvent(execute);

        const start = Object.assign({},
            defaultBatterAbility);
        start['name'] = '03 이승엽';

        addBatter(start).then(() => {
            setLineup(lineupBox, playerList.getAllPlayers(), execute);
            execute();
        });

    });
});

addBatterBtn.addEventListener('click', () => {
    addBatter(defaultBatterAbility).then(() => {
        setLineup(lineupBox, playerList.getAllPlayers(), execute);
        const scrollDiv = document.getElementById("boxes");
        scrollDiv.scrollTo({
            top: scrollDiv.scrollHeight,
            behavior: 'smooth' // 부드럽게 이동하고 싶을 때 추가
        });
    });
})

const startNumSelector = document.getElementById("start-num");
const saveCSVBtn = document.getElementById("save-csv");

saveCSVBtn.addEventListener('click', () => {
    downloadCSV(playerList.getAllPlayers(), 'line-up');
});

const readBatterCSVBtn = document.getElementById("read-batter-csv");

readBatterCSVBtn.addEventListener('change', () => {

    readBatterCSVBtn.files[0].text().then((csv) => {
        const playerObjs = readCSV(csv);

        const addBatterPromises = [];

        for (let i = 0; i < playerObjs.length; i++) {
            const p = addBatter(playerObjs[i]);
            addBatterPromises.push(p);
        }
        Promise.all(addBatterPromises).then(() => {
            setLineup(lineupBox, playerList.getAllPlayers(), execute);
            const scrollDiv = document.getElementById("boxes");
            scrollDiv.scrollTo({
                top: scrollDiv.scrollHeight,
                    behavior: 'smooth' // 부드럽게 이동하고 싶을 때 추가
            });
            readBatterCSVBtn.value = "";
        });
    });

});