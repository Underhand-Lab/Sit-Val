import { Div, Select, vars } from '@shared/bridges/UIBridge';
import React, { useState } from 'react';

const LineupRE24 = ({ data }) => {
  const [batterIdx, setBatterIdx] = useState(0);

  if (!data || !data[0] || !data[0].R) return null;
  const ret = data[0];
  const R = ret.R[batterIdx];

  const runnerStates = ["주자 없음", "1루", "2루", "3루", "1,2루", "1,3루", "2,3루", "만루"];

  return (
    <Div className="result-re">
      <Div style={{
        marginBottom: '15px', display: 'flex',
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: '10px',
      }}><Select
          value={batterIdx}
          onChange={(e) => setBatterIdx(parseInt(e.target.value))}
          options={Array.from({ length: 9 }).map((_, i) => ({
            value: i,
            label: `${i + 1}번 타자`,
          }))}
        />
        <label style={{ marginRight: '10px' }}>시작</label>

      </Div>

      <table className="re-table">
        <thead>
          <tr>
            <th style={{ backgroundColor: vars.background }}>주자 상태</th>
            <th style={{ backgroundColor: vars.background }}>0 아웃</th>
            <th style={{ backgroundColor: vars.background }}>1 아웃</th>
            <th style={{ backgroundColor: vars.background }}>2 아웃</th>
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
    </Div>
  );
};

export default LineupRE24;