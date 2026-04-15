import React from 'react';

const Visualizer9RE = ({ data, isLineup = false }) => {
  if (!data || !data[0]) return null;
  const ret = data[0];

  let expectedRuns = '0.000';
  if (isLineup) {
    // Lineup의 경우 ret.total_re 사용 (LineupPage에서 calculateLineupRE 결과 반환 시 포함됨)
    expectedRuns = ret.total_re ? ret.total_re.toFixed(3) : '0.000';
  } else {
    // League의 경우 R[0][0] * 9
    expectedRuns = ret['R'] ? (ret['R'][0][0] * 9).toFixed(3) : '0.000';
  }

  return (
    <div className="result-9re">
      <div className="final-score" style={{ marginTop: '15px', fontSize: '1.2em', fontWeight: 'bold', color: '#2c3e50' }}>
        <p>⚾ 
          <e-text key="label-team-expected-runs-per-9-innings">
            9이닝당 팀 기대 득점
          </e-text>:
          <span style={{ color: '#e74c3c', marginLeft: '5px' }}>
            {expectedRuns}
          </span>
        </p>
      </div>
    </div>
  );
};

export default Visualizer9RE;