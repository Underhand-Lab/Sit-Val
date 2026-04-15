import React, { useState } from 'react';

const LineupRE24 = ({ data }) => {
  const [batterIdx, setBatterIdx] = useState(0);
  
  if (!data || !data[0] || !data[0].R) return null;
  const ret = data[0];
  const R = ret.R[batterIdx];

  const runnerStates = ["주자 없음", "1루", "2루", "3루", "1,2루", "1,3루", "2,3루", "만루"];

  return (
    <div className="result-re">
      <div style={{ marginBottom: '15px' }}>
        <label style={{ marginRight: '10px' }}>시작 타선 선택:</label>
        <select 
          className="neumorphism-input" 
          value={batterIdx} 
          onChange={(e) => setBatterIdx(parseInt(e.target.value))}
          style={{ padding: '5px' }}
        >
          {Array.from({ length: 9 }).map((_, i) => (
            <option key={i} value={i}>{i + 1}번 타자</option>
          ))}
        </select>
      </div>

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
            const getVal = (offset) => {
              const val = R[j + offset];
              return (Array.isArray(val) ? val[0] : val).toFixed(3);
            };

            return (
              <tr key={j}>
                <td className="runner-state">
                  {runnerStates[j]}
                </td>
                <td>{getVal(0)}</td>
                <td>{getVal(8)}</td>
                <td>{getVal(16)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default LineupRE24;