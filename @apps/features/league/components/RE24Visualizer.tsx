import React, { useState } from 'react';
import { Box, Select, vars } from '@shared/bridges/UIBridge';
import { RECalculationResult } from '../api/re-league';

interface RE24VisualizerProps {
  data: [RECalculationResult & { R: number[] | number[][] }] | null;
  isLineup?: boolean;
}

const RE24Visualizer: React.FC<RE24VisualizerProps> = ({ data, isLineup = false }) => {
  const [batterIdx, setBatterIdx] = useState(0);
  if (!data || !data[0]) return null;
  const ret = data[0];

  // Lineup인 경우 ret.R은 [batter][state], League인 경우 ret.R은 [state]
  const R = isLineup ? (ret.R as number[][])[batterIdx] : (ret.R as number[]);
  if (!R) return null;

  const runnerStates = ["주자 없음", "1루", "2루", "3루", "1,2루", "1,3루", "2,3루", "만루"];

  return (
    <>
      <h3 style={{ margin: '0 0 10px 0' }}>RE24</h3>
      
      {isLineup && (
        <Box style={{ marginBottom: '10px' }}>
          <Select 
            className="start-num neumorphism-input" 
            value={batterIdx} 
            onChange={(e: any) => setBatterIdx(parseInt(e.target.value))}
          >
            {Array.from({ length: 9 }).map((_, i) => (
              <option key={i} value={i}>{i + 1}번 타자 시작</option>
            ))}
          </Select>
        </Box>
      )}

      <table className="re-table">
        <thead>
          <tr>
            <th style={{backgroundColor: vars.background}}>주자 상태</th>
            <th style={{backgroundColor: vars.background}}>0 아웃</th>
            <th style={{backgroundColor: vars.background}}>1 아웃</th>
            <th style={{backgroundColor: vars.background}}>2 아웃</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 8 }).map((_, j) => {
            const getValue = (idx: number) => {
                const val = R[idx];
                return (Array.isArray(val) ? val[0] : val).toFixed(3);
            };

            return (
              <tr key={j}>
                <td className="runner-state">{runnerStates[j]}</td>
                <td>{getValue(j)}</td>
                <td>{getValue(j + 8)}</td>
                <td>{getValue(j + 16)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
};

export default RE24Visualizer;