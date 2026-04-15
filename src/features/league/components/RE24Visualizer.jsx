import React, { useState } from 'react';

const RE24Visualizer = ({ data, isLineup = false }) => {
  const [batterIdx, setBatterIdx] = useState(0);
  if (!data || !data[0]) return null;
  const ret = data[0];

  // Lineup인 경우 ret.R은 [batter][state], League인 경우 ret.R은 [state]
  const R = isLineup ? ret.R[batterIdx] : ret.R;
  if (!R) return null;

  const runnerStates = ["주자 없음", "1루", "2루", "3루", "1,2루", "1,3루", "2,3루", "만루"];

  return (
    <div className="result-re24">
      <h3 style={{ margin: '0 0 10px 0' }}>RE24</h3>
      
      {isLineup && (
        <div style={{ marginBottom: '10px' }}>
          <select 
            className="start-num neumorphism-input" 
            value={batterIdx} 
            onChange={(e) => setBatterIdx(parseInt(e.target.value))}
          >
            {Array.from({ length: 9 }).map((_, i) => (
              <option key={i} value={i}>{i + 1}번 타자 시작</option>
            ))}
          </select>
        </div>
      )}

      <table className="re-table">
        <thead>
          <tr>
            <th>주자 상태</th>
            <th>0 아웃</th>
            <th>1 아웃</th>
            <th>2 아웃</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 8 }).map((_, j) => {
            // R 데이터 형식이 [[val], [val]...] 인 경우와 [val, val...] 인 경우를 모두 대응
            const getValue = (idx) => {
                const val = R[idx];
                return (Array.isArray(val) ? val[0] : val).toFixed(3);
            };

            return (
              <tr key={j}>
                <td className="runner-state">
                  {runnerStates[j]}
                </td>
                <td>{getValue(j)}</td>
                <td>{getValue(j + 8)}</td>
                <td>{getValue(j + 16)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default RE24Visualizer;