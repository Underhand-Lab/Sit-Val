import React, { useState } from 'react';
import { Box, InputNumber, H3 } from  '@shared/bridges/UIBridge';
import { RECalculationResult } from '../api/re-league';

function getBigInningProb(mu: number, variance: number, k: number = 1): number {
    if (k <= 0) return 1.0; 
    if (mu <= 1e-9) return 0.0;

    let prob0: number; 
    let getNextTerm: (currentProb: number, i: number) => number; 

    if (variance <= mu + 1e-9) {
        prob0 = Math.exp(-mu);
        getNextTerm = (currentProb, i) => currentProb * mu / (i + 1);
    } else {
        const r = (mu * mu) / (variance - mu);
        const p = r / (r + mu);
        const q = 1 - p; 
        prob0 = Math.pow(p, r); 
        getNextTerm = (currentProb, i) => currentProb * (i + r) / (i + 1) * q;
    }

    let probLessThanK = 0;
    let currentTermProb = prob0;

    for (let i = 0; i < k; i++) {
        probLessThanK += currentTermProb;
        if (currentTermProb < 1e-15) break;
        currentTermProb = getNextTerm(currentTermProb, i);
    }

    return Math.max(0, Math.min(1, 1 - probLessThanK));
}

interface LeagueBigInningVisualizerProps {
  data: [RECalculationResult & { R: number[] | number[][], variance: number[] | number[][] }] | null;
}

const LeagueBigInningVisualizer: React.FC<LeagueBigInningVisualizerProps> = ({ data }) => {
  const [goalRun, setGoalRun] = useState(1);

  if (!data || !data[0]) return null;
  const ret = data[0];

  const R = ret.R;
  const varData = ret.variance;
  
  if (!R || !varData) return null;

  const runnerStates = ["주자 없음", "1루", "2루", "3루", "1,2루", "1,3루", "2,3루", "만루"];

  return (
    <Box>
      <H3 style={{ margin: '0 0 10px 0' }}>
        <InputNumber
          className="neumorphism-input" 
          value={goalRun} 
          min="1"
          onChange={(e: any) => setGoalRun(Math.max(1, parseInt(e.target.value) || 1))}
          style={{ width: '60px' }}
        />
        <span>점 이상 확률</span>
      </H3>

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
            const getProb = (idx: number) => {
                const mu = Array.isArray(R[idx]) ? (R[idx] as number[])[0] : (R[idx] as number);
                const v = Array.isArray(varData[idx]) ? (varData[idx] as number[])[0] : (varData[idx] as number);
                return (getBigInningProb(mu, v, goalRun) * 100).toFixed(2);
            };
            return (
              <tr key={j}>
                <td className="runner-state">{runnerStates[j]}</td>
                <td>{getProb(j)}%</td>
                <td>{getProb(j + 8)}%</td>
                <td>{getProb(j + 16)}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Box>
  );
};

export default LeagueBigInningVisualizer;