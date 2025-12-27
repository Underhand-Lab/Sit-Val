class PlayerList {
    constructor() {
        this.players = [];
    }
    addPlayer(player, event) {
        let nextIdx = 0;
        let name = `${player['name']}`;

        while (this.players.some(p => p['name'] === name)) {
            name = `${player['name']} ${nextIdx}`;
            nextIdx++;
        }
        player['name'] = name;
        this.players.push(player);
        event();
    }
    removePlayer(player) {
        if (this.players.length < 2) {
            throw new Error(`선수가 1명 이상 필요합니다.`)
        }
        this.players = this.players.filter(p => p != player);

    }
    getAllPlayers() {
        return this.players;
    }
}

export { PlayerList }