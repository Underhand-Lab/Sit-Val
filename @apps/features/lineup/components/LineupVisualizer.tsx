import { Div, vars, H3 } from '@shared/bridges/UIBridge';
import React from 'react';
import { LineupCalculationResult } from '../api/re-line-up';
import { BasicStats } from '../../../types/BasicStats';

interface LineupVisualizerProps {
  data: [LineupCalculationResult, BasicStats] | null;
}

const LineupVisualizer: React.FC<LineupVisualizerProps> = ({ data }) => {
  if (!data) return null;
  const [ret, basic] = data;

  const expectedRuns = ret.total_re ? ret.total_re.toFixed(3) : '0.000';

  const StatItem = ({ label, value, color }: { label: string; value: string | number; color?: string }) => (
    <Div style={{ textAlign: 'center', padding: '10px' }}>
      <span style={{ fontSize: '0.85em', color: '#666', display: 'block', marginBottom: '4px' }}>{label}</span>
      <Div style={{ fontWeight: 'bold', color: color || vars.text, fontSize: '1.1em' }}>{value}</Div>
    </Div>
  );

  return (
    <Div className="result-visualizer" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Div style={{ padding: '20px', textAlign: 'center' }}>
        <span style={{ fontSize: '0.9em', color: '#666' }}>9이닝당 팀 기대 득점</span>
        <Div style={{ fontSize: '2.4em', fontWeight: 'bold', color: '#e74c3c', marginTop: '5px' }}>
          {expectedRuns}
        </Div>
      </Div>

      {basic && (
        <Div style={{ padding: '15px' }}>
          <H3 style={{ margin: '0 0 15px 0', fontSize: '1em' }}>기본 통계</H3>
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
        </Div>
      )}
    </Div>
  );
};

export default LineupVisualizer;