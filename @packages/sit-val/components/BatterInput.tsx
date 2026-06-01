import React, { useState, useImperativeHandle, forwardRef, useEffect, ChangeEvent, useMemo } from 'react';
import { InputNumber } from '@shared/bridges/UIBridge';

import { BatterStatsData, BatterStats } from '../types/BatterStats';

export interface BatterInputHandle {
  setData: (newData: BatterStatsData) => void;
  getAbilityRaw: () => BatterStatsData;
  getAbility: () => {
    '1B': number;
    '2B': number;
    '3B': number;
    hr: number;
    bb: number;
    so: number;
    go: number;
    fo: number;
  };
}

interface BatterInputProps {
  onDataChange?: (stats: BatterStatsData) => void;
  id?: string;
  initialStats?: BatterStatsData;
}

const BatterInput = forwardRef<BatterInputHandle, BatterInputProps>(({ onDataChange, id, initialStats }, ref) => {
  const [stats, setStats] = useState<BatterStatsData>(initialStats ? { ...initialStats } : new BatterStats());

  // initialStats prop이 변경될 때마다 내부 stats 상태를 업데이트
  useEffect(() => {
    if (initialStats) {
      setStats(initialStats);
    }
  }, [initialStats]);

  // BatterStats 인스턴스를 통해 pa 자동 계산 활용
  const statsInstance = useMemo(() => new BatterStats(stats), [stats]);
  const pa = statsInstance.pa;

  const hits = (statsInstance['1B'] || 0) + (statsInstance['2B'] || 0) + (statsInstance['3B'] || 0) + (statsInstance.hr || 0);
  const ab_outs = (statsInstance.so || 0) + (statsInstance.go || 0) + ((statsInstance.fo || 0) - (statsInstance.sf || 0));
  const ab = hits + ab_outs;

  const ob = hits + (statsInstance.bb || 0) + (statsInstance.hbp || 0);
  const tb = (statsInstance['1B'] || 0) + (statsInstance['2B'] || 0) * 2 + (statsInstance['3B'] || 0) * 3 + (statsInstance.hr || 0) * 4;

  const avg = ab > 0 ? hits / ab : 0;
  const obp = pa > 0 ? ob / pa : 0;
  const slg = ab > 0 ? tb / ab : 0;
  const ops = obp + slg;

  useImperativeHandle(ref, (): BatterInputHandle => ({
    setData: (newData) => setStats(newData),
    getAbilityRaw: () => statsInstance,
    getAbility: () => {
      const validPa = Math.max(1, statsInstance.pa);
      return {
        '1B': (statsInstance['1B'] || 0) / validPa,
        '2B': (statsInstance['2B'] || 0) / validPa,
        '3B': (statsInstance['3B'] || 0) / validPa,
        hr: (statsInstance.hr || 0) / validPa,
        bb: (statsInstance.bb || 0) / validPa,
        so: (statsInstance.so || 0) / validPa,
        go: (statsInstance.go || 0) / validPa,
        fo: (statsInstance.fo || 0) / validPa,
      };
    }
  }));

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const val = Math.max(0, parseFloat(value) || 0);
    
    const nextStats = { ...stats, [name]: val } as BatterStatsData;
    // pa는 입력 값이 아니므로 명시적으로 제거하여 오동작 방지
    delete nextStats.pa;

    setStats(nextStats);
    if (onDataChange) onDataChange(nextStats);
  };

  return (
    <div
      id={id}
      className="batter-input-container"
      style={{ flex: 1, overflowY: 'auto' }}
    >

      <div style={{ display: 'flex', flexDirection: 'column', padding: '20px', gap: '20px' }}>
        <div style={{
          display: 'flex', flexDirection: 'row', flexWrap: 'wrap',
          justifyContent: 'center', gap: '15px'
        }}>
          <div >타석: {pa}</div>
          <div >타수: {ab}</div>
          <div >안타: {hits}</div>
          <div >출루: {ob}</div>
          <div >장타수: {tb}</div>
        </div>
        <div style={{
          display: 'flex', flexDirection: 'row', flexWrap: 'wrap',
          justifyContent: 'center', gap: '15px'
        }}>
          <div >타율: {avg.toFixed(3)}</div>
          <div >출루율: {obp.toFixed(3)}</div>
          <div >장타율: {slg.toFixed(3)}</div>
          <div >OPS: {ops.toFixed(3)}</div>
        </div>
      </div>
      <hr />

      {/* 안타 섹션 */}
      <div>
        <div className="input-form">
          <div className="input-group">
            볼넷
            <InputNumber name="bb" value={stats.bb} onChange={handleChange} min="0" />
          </div>
          <div className="input-group">
            사구(HBP)
            <InputNumber name="hbp" value={stats.hbp || 0} onChange={handleChange} min="0" />
          </div>
          <div className="input-group">
            1루타
            <InputNumber name="1B" value={stats['1B']} onChange={handleChange} min="0" />
          </div>
          <div className="input-group">
            2루타
            <InputNumber name="2B" value={stats['2B']} onChange={handleChange} min="0" />
          </div>
          <div className="input-group">
            3루타
            <InputNumber name="3B" value={stats['3B']} onChange={handleChange} min="0" />
          </div>
          <div className="input-group">
            홈런
            <InputNumber name="hr" value={stats.hr} onChange={handleChange} min="0" />
          </div>
        </div>
      </div>
      <hr />

      {/* 아웃 섹션 */}
      <div>
        <div className="input-form">
          <div className="input-group">
            삼진 아웃
            <InputNumber name="so" value={stats.so} onChange={handleChange} min="0" />
          </div>
          <div className="input-group">
            땅볼 아웃
            <InputNumber name="go" value={stats.go} onChange={handleChange} min="0" />
          </div>
          <div className="input-group">
            뜬공 아웃
            <InputNumber name="fo" value={stats.fo} onChange={handleChange} min="0" />
          </div>
          <div className="input-group">
            희생플라이
            <InputNumber name="sf" value={stats.sf || 0} onChange={handleChange} min="0" />
          </div>
          <div className="input-group">
            희생번트
            <InputNumber name="sh" value={stats.sh || 0} onChange={handleChange} min="0" />
          </div>
        </div>
      </div>

    </div>
  );
});

BatterInput.displayName = 'BatterInput';
export default BatterInput;