import React from 'react';

const LeagueVisualizer = ({ data }) => {
  if (!data) return null;
  const [ret, weights, lgWobaRaw, wOBAScale, runPerPa] = data;

  return (
    <div className="result-league">
      <h3 style={{ margin: '0 0 10px 0' }}>리그 확장 가치</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <p className="league-woba-scale">wOBA Scale: {wOBAScale.toFixed(3)}</p>
        <p className="league-p-pa">R/PA: {runPerPa.toFixed(3)}</p>
        <p className="league-p-pa-custom">
          R/PA(Custom): {ret['R_PA_Custom'] ? 
            (Array.isArray(ret['R_PA_Custom']) ? ret['R_PA_Custom'][0] : ret['R_PA_Custom']).toFixed(3) 
            : '0.000'}
        </p>
      </div>
      <p style={{ fontSize: '0.85em', color: '#666', marginTop: '10px' }}>
        ※ 위 지표들은 입력된 리그 성적을 바탕으로 계산된 기대 득점 및 가중치입니다.
      </p>
    </div>
  );
};

export default LeagueVisualizer;