import * as Calc from "/src/sabermetrics/calc.js";

function visualizeRE(RE) {
    if (!RE) {
        // 오류 메시지는 solve_absorbing_chain_equation에서 이미 처리됨
        return "";
    }

    const runnserStates = [
        "주자 없음", "1루", "2루", "3루",
        "1, 2루", "1, 3루", "2, 3루", "만루"
    ];

    let html = `
        <table class="re-table">
            <thead>
                <tr>
                    <th>주자 상황</th>
                    <th>0 아웃</th>
                    <th>1 아웃</th>
                    <th>2 아웃</th>
                </tr>
            </thead>
            <tbody>
    `;

    for (let j = 0; j < 8; j++) {
        const re_0_out = RE[j][0].toFixed(3);
        const re_1_out = RE[j + 8][0].toFixed(3);
        const re_2_out = RE[j + 16][0].toFixed(3);

        html += `
            <tr>
                <td class="runner-state">${runnserStates[j]}</td>
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

function visualizeRunValue(dataList) {
    if (!dataList) {
        return "";
    }

    // 1. 객체를 배열로 변환
    const sortedItems = Object.keys(dataList).map(key => ({
        label: key,
        ...dataList[key]
    }));

    // 2. value 기준 내림차순 정렬 (b.value - a.value)
    sortedItems.sort((a, b) => b.value - a.value);

    let html = `
    <table class="re-table">
        <thead>
            <tr>
                <th>타구</th>
                <th>가치</th>
            </tr>
        </thead>
        <tbody>
`;

    // 3. 정렬된 배열(sortedItems)로 HTML 생성
    for (const item of sortedItems) {
        html += `
        <tr>
            <td class="runner-state">${item.name}</td>
            <td>${item.value.toFixed(3)}</td>
        </tr>
    `;
    }

    html += `
        </tbody>
    </table>
`;

    return html;
}

function visualize9RE(RE) {
    return `
            <div class="final-score" style="margin-top: 15px; font-size: 1.2em; font-weight: bold; color: #2c3e50;">
                <p>⚾ 9이닝당 리그 기대 득점:
                    <span style="color: #e74c3c;">
                        ${(RE[0][0] * 9).toFixed(3)}
                    </span>
                </p>
            </div>`;

}

let ret_RE;
let ret_runValue;

let lgWobaRaw;
let wOBAScale;
let runPerPa;
let weights;

let batterInput;

function round(value, cnt) {
    let c = 1

    for (let i = 0; i < cnt; i++) { c *= 10; }

    return Math.round(value * c) / c;
}

function visualizePersonal(batterAbility) {

    if (!batterAbility) return;

    const playerWobaRaw = Calc.calculateCustomWOBA(
        weights, batterAbility);

    const playerPA = batterAbility['pa'];

    const playerWRAAFromWoba = Calc.calculateWRAAPlusFromWoba(
        playerWobaRaw, lgWobaRaw, 1, playerPA);

    const playerCustomWRAA = Calc.calculateCustomWRAAPlus(
        batterAbility, ret_runValue);

    const wrcPlus = Calc.calculateWRCPlus(
        playerWRAAFromWoba / playerPA, runPerPa
    );

    const wrcPlusCustom = Calc.calculateWRCPlus(
        playerCustomWRAA / playerPA, runPerPa
    );

    document.getElementById('league-woba-scale').innerHTML
        = `wOBA Scale: ${wOBAScale.toFixed(3)}`;
    document.getElementById('league-p-pa').innerHTML
        = `R/PA: ${runPerPa.toFixed(2)}`;

    document.getElementById('personal-woba').innerHTML
        = `가중 출루율(wOBA): ${(playerWobaRaw * wOBAScale).toFixed(3)}`;

    document.getElementById('personal-wraa').innerHTML
        = `wRAA: ${round(playerWRAAFromWoba, 2).toFixed(2)}`;
    document.getElementById('personal-wraa-custom').innerHTML
        = `wRAA(커스텀): ${round(playerCustomWRAA, 2).toFixed(2)}`;

    document.getElementById('personal-wrcplus').innerHTML
        = `wRC+: ${round(wrcPlus, 2).toFixed(2)}`;
    document.getElementById('personal-wrcplus-custom').innerHTML
        = `wRC+(커스텀): ${round(wrcPlusCustom, 2).toFixed(2)}`;

}

export function visualize(ret, leagueBatter, runnerAbility,
    transitionEngine) {

    ret_RE = ret

    const labels = ['볼넷', '1루타', '2루타', '3루타', '홈런', '삼진', '뜬공', '땅볼'];
    const actions = ['bb', '1B', '2B', '3B', 'hr', 'so', 'fo', 'go'];

    ret_runValue = actions.reduce((acc, action, index) => {
        const value = Calc.getRunValue(action, runnerAbility, transitionEngine, ret.RE_data, ret.N_data);

        acc[action] = {
            name: labels[index],
            value: value
        };

        return acc;
    }, {});

    weights = Calc.calculateWeightedRunValue(
        leagueBatter.getAbilityRaw(), ret_runValue);
    lgWobaRaw = Calc.calculateCustomWOBA(
        weights, leagueBatter.getAbilityRaw());
    wOBAScale = 0.33 / lgWobaRaw;
    runPerPa = Calc.calculateLeagueRunPerPA(
        ret_RE.RE_data[0][0], leagueBatter.getAbilityRaw());

    document.getElementById('result').innerHTML =
        visualizeRE(ret_RE.RE_data);

    document.getElementById('value').innerHTML =
        visualizeRunValue(ret_runValue);

    document.getElementById('result-9re').innerHTML =
        visualize9RE(ret_RE.RE_data);

    if (batterInput) {
        visualizePersonal(batterInput.getAbilityRaw());
    }
}

export function setPersonalBatterInput(personalBatterInput) {

    batterInput = personalBatterInput;
    batterInput.setEvent(() => {
        if (!ret_RE) return;
        visualizePersonal(batterInput.getAbilityRaw());
    });

}