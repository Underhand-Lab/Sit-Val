export function calculateWeightedRunValue(leagueStats, runValue) {
    const totalOuts = leagueStats['so'] + leagueStats['go'] + leagueStats['fo'];

    // 2. 리그 실제 비율이 반영된 가중 평균 아웃 가치 계산
    const weightedAvgOutRE = (
        (leagueStats['so'] * runValue['so'].value) +
        (leagueStats['go'] * runValue['go'].value) +
        (leagueStats['fo'] * runValue['fo'].value)
    ) / totalOuts;

    return {
        'bb': (runValue['bb'].value - weightedAvgOutRE),
        '1B': (runValue['1B'].value - weightedAvgOutRE),
        '2B': (runValue['2B'].value - weightedAvgOutRE),
        '3B': (runValue['3B'].value - weightedAvgOutRE),
        'hr': (runValue['hr'].value - weightedAvgOutRE)
    };

}

export function calculateCustomWOBA(weights, batterStats) {

    // 3. 분자 (Weighted Runs) 계산
    const weightedSum =
        (batterStats['bb'] * weights['bb']) +
        (batterStats['1B'] * weights['1B']) +
        (batterStats['2B'] * weights['2B']) +
        (batterStats['3B'] * weights['3B']) +
        (batterStats['hr'] * weights['hr']);

    const pa = batterStats['pa'];

    if (pa === 0) return 0;

    const wOBA = weightedSum / pa;

    return wOBA;
}

export function calculateCustomWRAAPlus(batterStats, runValue) {

    let weightedSum = 0;
    for (let i in runValue) {
        weightedSum += batterStats[i] * runValue[i].value;
    }

    return weightedSum;
}

export function calculateWRAAPlusFromWoba(
    playerWoba, leagueWoba, wobaScale, pa) {
    
    return ((playerWoba - leagueWoba) / wobaScale) * pa;
    
}

export function calculateLeagueRunPerPA(startRE, leagueStats) {

    const outs = leagueStats['so'] + leagueStats['go']
        + leagueStats['fo'];

    const totalPA = leagueStats['pa'];

    // 2. 이닝당 평균 타석 수 (Average PA per Inning) 계산
    // 야구는 한 이닝에 무조건 3아웃이 발생해야 끝납니다.
    // 공식: (전체 타석 / 전체 아웃) * 3
    const avgPAperInning = (totalPA / (outs)) * 3;

    // 3. 타석당 기대 득점 (Run per PA)
    // (이닝당 기대 득점 / 이닝당 평균 타석 수)
    return startRE / avgPAperInning;
}

export function calculateCustomWRCPlus(batterStats, runValue, runPerPa) {
    
    return (calculateCustomWRAAPlus(batterStats, runValue) /
        runPerPa + 1) * 100;
}

export function calculateWRCPlus(wraaPerPa, runPerPa) {

    return ((wraaPerPa / runPerPa) + 1) * 100;

}