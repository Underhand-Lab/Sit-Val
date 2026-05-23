import { Div, Select, InputNumber, vars } from '@shared/bridges/UIBridge';
import React, { useState } from 'react';
import { LineupCalculationResult } from '../api/re-line-up';

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

interface LineupBigInningVisualizerProps {
  data: [LineupCalculationResult] | null;
}

const LineupBigInningVisualizer: React.FC<LineupBigInningVisualizerProps> = ({ data }) => {
  const [batterIdx, setBatterIdx] = useState(0);
  const [goalRun, setGoalRun] = useState(1);

  if (!data || !data[0]) return null;
  const ret = data[0];

  const R = ret.R[batterIdx];
  const varData = ret.variance[batterIdx];

  if (!R || !varData) return null;

  const runnerStates = ["주자 없음", "1루", "2루", "3루", "1,2루", "1,3루", "2,3루", "만루"];

  return (
    <Div className="result-big-inning">

      <Div style={{
        marginBottom: '15px', display: 'flex',
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: '10px',
      }}><Select
          value={batterIdx.toString()}
          onChange={(e: any) => setBatterIdx(parseInt(e.target.value))}
          options={Array.from({ length: 9 }).map((_, i) => ({
            value: i,
            label: `${i + 1}번 타자`,
          }))}
        />
        <span>시작 </span>
        <InputNumber
          className="neumorphism-input"
          value={goalRun}
          min="1"
          onChange={(e: any) => setGoalRun(Math.max(1, parseInt(e.target.value) || 1))}
          style={{ maxWidth: '60px' }}
        />
        <span>점 이상 확률</span>
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
            const getProb = (idx: number) => {
              const mu = Array.isArray(R[idx]) ? (R[idx] as any)[0] : R[idx];
              const v = Array.isArray(varData[idx]) ? (varData[idx] as any)[0] : varData[idx];
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
    </Div>
  );
};

export default LineupBigInningVisualizer;