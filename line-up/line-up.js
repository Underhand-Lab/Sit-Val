let playerList;

export function setLineup(element, players, event) {

    let str = ''
    const defaultBatters = element.getElementsByTagName('select');
    playerList = players;

    for (let i = 0; i < 9; i++) {
        str += `<div><label>${i + 1}번타자</label>: `
        str += `<select>`;
        for (let j = 0; j < playerList.length; j++) {
            str += `<option value="${j}"`
            if (defaultBatters.length > i &&
                defaultBatters[i].value == j) {
                str += ` selected`;
            }
            str += `>${playerList[j]['name']}</option>`
        }
        str += `</select></div>`;
    }

    element.innerHTML = str;

    const batters = element.getElementsByTagName('select');

    for (let i = 0; i < batters.length; i++) {
        batters[i].addEventListener('change', () => {
            event();
        });
    }
}

export function getLineup(element, func) {

    const batters = element.getElementsByTagName('select');
    let inputLineup = [];

    for (let i = 0; i < 9; i++) {
        const value = parseInt(batters[i].value);
        inputLineup.push(playerList[value]);
    }

    return inputLineup.map(ability => func(ability));

}