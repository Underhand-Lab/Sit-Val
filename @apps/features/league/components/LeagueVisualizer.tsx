import { vars } from '@shared/bridges/UIBridge';
import React from 'react';
import { RECalculationResult } from '../api/re-league';
import { WOBAWeights } from '@sit-val/lib/sabermetrics/calc';

interface LeagueVisualizerProps {
  data: [RECalculationResult, WOBAWeights, number, number, number] | null;
}

const LeagueVisualizer: React.FC<LeagueVisualizerProps> = ({ data }) => {
  if (!data) return null;
  const [ret, , , wOBAScale, runPerPa] = data;

  const customRunPerPa = ret['R_PA_Custom'];

  return (
    <div className="result-league">
      <h3 style={{ margin: '0 0 10px 0' }}>리그 확장 가치</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <p className="league-woba-scale">wOBA Scale: {wOBAScale.toFixed(3)}</p>
        <p className="league-p-pa">R/PA: {runPerPa.toFixed(3)}</p>
        <p className="league-p-pa-custom">
          R/PA(Custom): {customRunPerPa !== undefined ? 
            (Array.isArray(customRunPerPa) ? customRunPerPa[0] : customRunPerPa).toFixed(3) 
            : '0.000'}
        </p>
      </div>
      <p style={{ fontSize: '0.85em', color: vars.text, marginTop: '10px' }}>
        ※ 위 지표들은 입력된 리그 성적을 바탕으로 계산된 기대 득점 및 가중치입니다.
      </p>
    </div>
  );
};

export default LeagueVisualizer;