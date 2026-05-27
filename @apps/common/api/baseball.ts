import { BatterStatsData } from '@sit-val/types/BatterStats';

export const calculateBasicStats = (s: BatterStatsData) => {
	const h = (s['1B'] || 0) + (s['2B'] || 0) + (s['3B'] || 0) + (s.hr || 0);
	const ab = (s.pa || 0) - (s.bb || 0) - (s.hbp || 0) - (s.sf || 0) - (s.sh || 0);
	const ob = h + (s.bb || 0) + (s.hbp || 0);
	const tb = (s['1B'] || 0) + (s['2B'] || 0) * 2 + (s['3B'] || 0) * 3 + (s.hr || 0) * 4;
	const avg = ab > 0 ? h / ab : 0;
	const obp = (s.pa - (s.sh || 0)) > 0 ? ob / (s.pa - (s.sh || 0)) : 0;
	const slg = ab > 0 ? tb / ab : 0;
	const ops = obp + slg;
	return {
		pa: s.pa || 0, ab, h, ob, tb,
		avg, obp, slg, ops
	};
};