import { BatterStatsData } from '@sit-val/types/BatterStats';

/**
 * 원본 타격 스탯을 기반으로 타석당 발생 확률(Ability)을 계산합니다.
 */
export const calculateBatterAbility = (rawStats: BatterStatsData) => {
  const hits = (rawStats['1B'] || 0) + (rawStats['2B'] || 0) + (rawStats['3B'] || 0) + (rawStats.hr || 0);
  const calculatedPa = hits + (rawStats.so || 0) + (rawStats.go || 0) + (rawStats.fo || 0) + 
                       (rawStats.bb || 0) + (rawStats.hbp || 0) + (rawStats.sh || 0);
  const pa = Math.max(1, rawStats.pa || calculatedPa);
  
  const getRate = (val: number | undefined) => (val || 0) / pa;

  return {
    '1B': getRate(rawStats['1B']), '2B': getRate(rawStats['2B']),
    '3B': getRate(rawStats['3B']), hr: getRate(rawStats.hr),
    bb: getRate(rawStats.bb), so: getRate(rawStats.so),
    go: getRate(rawStats.go), fo: getRate(rawStats.fo),
    pa,
  };
};