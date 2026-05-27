import { Box, Div, vars, H3 } from '@shared/bridges/UIBridge';
import React from 'react';
import { BatterStatsData } from '@sit-val/types/BatterStats';
import { calculateBasicStats } from '../../../common/api/baseball';

interface PlayerBasicVisualizerProps {
  batterStats: BatterStatsData;
}

const PlayerBasicVisualizer: React.FC<PlayerBasicVisualizerProps> = ({ batterStats }) => {
  if (!batterStats) return null;
  const basic = calculateBasicStats(batterStats);

  const StatItem = ({ label, value, color }: { label: string; value: string | number; color?: string }) => (
    <Div style={{ textAlign: 'center', padding: '10px' }}>
      <span style={{ fontSize: '0.85em', color: '#666', display: 'block', marginBottom: '4px' }}>{label}</span>
      <Div style={{ fontWeight: 'bold', color: color || vars.text, fontSize: '1.1em' }}>{value}</Div>
    </Div>
  );

  return (
    <Div className="result-basic" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Box style={{ padding: '15px' }}>
        <H3 style={{ margin: '0 0 15px 0', fontSize: '1em' }}>기본 타격 지표</H3>
        <Div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '10px', 
          borderTop: `1px solid ${vars.surface}`, 
          paddingTop: '10px' 
        }}>
          <StatItem label="타석" value={basic.pa} />
          <StatItem label="타수" value={basic.ab} />
          <StatItem label="안타" value={basic.h} />
          <StatItem label="출루" value={basic.ob} />
          <StatItem label="루타수" value={basic.tb} />
          <StatItem label="타율" value={basic.avg.toFixed(3)} />
          <StatItem label="출루율" value={basic.obp.toFixed(3)} />
          <StatItem label="장타율" value={basic.slg.toFixed(3)} />
          <StatItem label="OPS" value={basic.ops.toFixed(3)} color={vars.primary} />
        </Div>
      </Box>
    </Div>
  );
};

export default PlayerBasicVisualizer;