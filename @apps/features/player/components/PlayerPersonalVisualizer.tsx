import { Div, vars, H3 } from '@shared/bridges/UIBridge';
import React from 'react';
import { RECalculationResult } from '../../league/api/re-league';
import { WOBAWeights } from '@sit-val/lib/sabermetrics/calc';
import { BatterStatsData } from '@sit-val/types/BatterStats';

interface PlayerPersonalVisualizerProps {
  data: [RECalculationResult, WOBAWeights, number, number, number] | null;
  batterStats: BatterStatsData;
}

const PlayerPersonalVisualizer: React.FC<PlayerPersonalVisualizerProps> = ({ data, batterStats }) => {
  if (!batterStats) return null;
  
  if (!data || !data[0] || !data[1]) {
    return (
      <Div style={{ padding: '20px', textAlign: 'center' }}>
        <H3 style={{ fontSize: '1em', marginBottom: '10px' }}>개인 확장 가치</H3>
        <p style={{ color: '#666', fontSize: '0.9em' }}>
          리그 데이터가 연결되지 않았습니다.<br/>
          [정보 설정]에서 리그를 연동하면 wRC+, wRAA 등을 계산할 수 있습니다.
        </p>
      </Div>
    );
  }
  const [ret, weights, lgWobaRaw, wOBAScale, runPerPa] = data;

  const calculateWoba = () => {
    const { bb, hbp, '1B': b1, '2B': b2, '3B': b3, hr, pa } = batterStats;
    if (!pa) return 0;
    const numerator =
      (bb * (weights.bb || 0)) +
      ((hbp || 0) * (weights.hbp || 0)) +
      (b1 * (weights['1B'] || 0)) +
      (b2 * (weights['2B'] || 0)) +
      (b3 * (weights['3B'] || 0)) +
      (hr * (weights.hr || 0));
    return numerator / pa;
  };

  const calculateCustomWraa = () => {
    if (!ret?.runValue) return 0;
    const rv = ret.runValue;
    const events = ['bb', 'hbp', '1B', '2B', '3B', 'hr', 'so', 'go', 'fo'];
    return events.reduce((acc, event) => {
      return acc + (batterStats[event] || 0) * (rv[event]?.value || 0);
    }, 0);
  };

  const personalWoba = calculateWoba();
  const personalWobaScaled = personalWoba * wOBAScale;
  const wraa = wOBAScale > 0 ? ((personalWoba - lgWobaRaw) / wOBAScale) * (batterStats.pa || 0) : 0;
  const wraaCustom = calculateCustomWraa();

  const calculateWrcPlus = (currentWraa: number, currentRunPerPa: number) => {
    if (!batterStats.pa || !currentRunPerPa) return 0;
    return ((currentWraa / batterStats.pa) / currentRunPerPa + 1) * 100;
  };

  const wrcPlus = calculateWrcPlus(wraa, runPerPa);
  const customRunPerPa = Array.isArray(ret['R_PA_Custom']) ? ret['R_PA_Custom'][0] : ret['R_PA_Custom'];
  const wrcPlusCustom = calculateWrcPlus(wraaCustom, customRunPerPa || 0);

  const StatItem = ({ label, value, color }: { label: string; value: string | number; color?: string }) => (
    <Div style={{ textAlign: 'center', padding: '10px' }}>
      <span style={{ fontSize: '0.85em', color: '#666', display: 'block', marginBottom: '4px' }}>{label}</span>
      <Div style={{ fontWeight: 'bold', color: color || vars.text, fontSize: '1.1em' }}>{value}</Div>
    </Div>
  );

  return (
    <Div className="result-personal" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Div style={{ padding: '15px' }}>
        <H3 style={{ margin: '0 0 15px 0', fontSize: '1em' }}>개인 확장 가치</H3>
        <Div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', borderTop: `1px solid ${vars.surface}`, paddingTop: '10px' }}>
          <StatItem label="wOBA" value={personalWobaScaled.toFixed(3)} color="#e74c3c" />
          <StatItem label="wRC+" value={Math.round(wrcPlus)} color={vars.primary} />
          <StatItem label="wRAA (표준)" value={(wraa > 0 ? '+' : '') + wraa.toFixed(2)} color={wraa >= 0 ? '#e74c3c' : '#3498db'} />
          <StatItem label="wRAA (커스텀)" value={(wraaCustom > 0 ? '+' : '') + wraaCustom.toFixed(2)} color={wraaCustom >= 0 ? '#e74c3c' : '#3498db'} />
          <StatItem label="wRC+ (커스텀)" value={Math.round(wrcPlusCustom)} color={vars.primary} />
          <StatItem label="타석당 가치" value={(wraaCustom / (batterStats.pa || 1)).toFixed(3)} color={vars.primary} />
        </Div>
        <p style={{ fontSize: '0.85em', color: vars.text, marginTop: '10px' }}>
          ※ 해당 선수의 성적을 바탕으로 리그 환경 대비 가치를 산출한 결과입니다.
        </p>
      </Div>
    </Div>
  );
};

export default PlayerPersonalVisualizer;