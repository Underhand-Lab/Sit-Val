import { BatterStatsData } from "@packages/sit-val/types/BatterStats";

export interface RunValueItem {
    value: number;
}

export interface RunValueMap {
    [key: string]: RunValueItem;
}

export interface WOBAWeights {
    [key: string]: number;
}

export function calculateWeightedRunValue(leagueStats: BatterStatsData, runValue: RunValueMap): Record<string, number> {
    const s = leagueStats;
    const totalOuts = (s['so'] || 0) + (s['go'] || 0) + (s['fo'] || 0);

    // 2. 리그 실제 비율이 반영된 가중 평균 아웃 가치 계산
    const weightedAvgOutRE = (
        ((s['so'] || 0) * (runValue['so']?.value || 0)) +
        ((s['go'] || 0) * (runValue['go']?.value || 0)) +
        ((s['fo'] || 0) * (runValue['fo']?.value || 0))
    ) / totalOuts;

    return {
        'bb': ((runValue['bb']?.value || 0) - weightedAvgOutRE),
        '1B': ((runValue['1B']?.value || 0) - weightedAvgOutRE),
        '2B': ((runValue['2B']?.value || 0) - weightedAvgOutRE),
        '3B': ((runValue['3B']?.value || 0) - weightedAvgOutRE),
        'hr': ((runValue['hr']?.value || 0) - weightedAvgOutRE)
    };
}

export function calculateCustomWOBA(weights: WOBAWeights, batterStats: BatterStatsData): number {
    const s = batterStats;
    // 3. 분자 (Weighted Runs) 계산
    const weightedSum =
        ((s['bb'] || 0) * (weights['bb'] || 0)) +
        ((s['1B'] || 0) * (weights['1B'] || 0)) +
        ((s['2B'] || 0) * (weights['2B'] || 0)) +
        ((s['3B'] || 0) * (weights['3B'] || 0)) +
        ((s['hr'] || 0) * (weights['hr'] || 0));

    const pa = batterStats.pa;
    if (pa === 0) return 0;

    return weightedSum / pa;
}

export function calculateCustomWRAAPlus(batterStats: BatterStatsData, runValue: RunValueMap): number {
    let weightedSum = 0;
    for (const i in runValue) {
        weightedSum += (batterStats[i] || 0) * runValue[i].value;
    }
    return weightedSum;
}

export function calculateWRAAPlusFromWoba(playerWoba: number, leagueWoba: number, wobaScale: number, pa: number): number {
    return ((playerWoba - leagueWoba) / wobaScale) * pa;
}

export function calculateLeagueRunPerPA(startRE: number, leagueStats: BatterStatsData): number {
    const outs = (leagueStats['so'] || 0) + (leagueStats['go'] || 0) + (leagueStats['fo'] || 0);
    const totalPA = leagueStats.pa;
    const avgPAperInning = (totalPA / outs) * 3;
    return startRE / avgPAperInning;
}

export function calculateCustomWRCPlus(batterStats: BatterStatsData, runValue: RunValueMap, runPerPa: number): number {
    return (calculateCustomWRAAPlus(batterStats, runValue) / runPerPa + 1) * 100;
}

export function calculateWRCPlus(wraaPerPa: number, runPerPa: number): number {
    return ((wraaPerPa / runPerPa) + 1) * 100;
}