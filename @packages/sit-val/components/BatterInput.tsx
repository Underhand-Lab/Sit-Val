import { useState, useImperativeHandle, forwardRef, useEffect, ChangeEvent } from 'react';
import { InputNumber } from '@shared/bridges/UIBridge';

import { BatterStats, BatterStatsData } from '../types/BatterStats';

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
  const [stats, setStats] = useState<BatterStats>(new BatterStats({
    bb: 111,
    '1B': 65,
    '2B': 23,
    '3B': 0,
    hr: 56,
    go: 117,
    fo: 135,
    so: 89,
    sf: 0,
    sh: 0,
    hbp: 0,
  }));

  // initialStats prop이 변경될 때마다 내부 stats 상태를 업데이트
  useEffect(() => {
    if (initialStats) {
      setStats(new BatterStats(initialStats));
    }
  }, [initialStats]);

  // 지표 기반 자동 계산 로직
  const hits = stats['1B'] + stats['2B'] + stats['3B'] + stats.hr;
  // 뜬공(fo)에 희생플라이(sf)가 포함되어 있으므로 타수(AB) 계산 시 sf를 제외함
  const ab_outs = stats.so + stats.go + (stats.fo - (stats.sf || 0));
  const ab = hits + ab_outs;
  const pa = stats.pa;
  const ob = hits + stats.bb + (stats.hbp || 0);
  const tb = stats['1B'] + stats['2B'] * 2 + stats['3B'] * 3 + stats.hr * 4;

  const avg = ab > 0 ? hits / ab : 0;
  const obp = pa > 0 ? ob / pa : 0;
  const slg = ab > 0 ? tb / ab : 0;
  const ops = obp + slg;

  useImperativeHandle(ref, (): BatterInputHandle => ({
    setData: (newData) => setStats(new BatterStats(newData)),
    getAbilityRaw: () => ({ 
        ...stats, 
        pa: stats.pa 
    } as BatterStatsData),
    getAbility: () => {
      const validPa = Math.max(1, pa);
      return {
        '1B': stats['1B'] / validPa,
        '2B': stats['2B'] / validPa,
        '3B': stats['3B'] / validPa,
        hr: stats.hr / validPa,
        bb: stats.bb / validPa,
        so: stats.so / validPa,
        go: stats.go / validPa,
        fo: stats.fo / validPa,
      };
    }
  }));

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const val = parseFloat(value) || 0;
    
    const nextStats = new BatterStats({ ...stats, [name]: val });

    setStats(nextStats);
    if (onDataChange) onDataChange({ 
        ...nextStats, 
        pa: nextStats.pa 
    } as BatterStatsData);
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
            <InputNumber name="bb" value={stats.bb} onChange={handleChange} />
          </div>
          <div className="input-group">
            사구(HBP)
            <InputNumber name="hbp" value={stats.hbp || 0} onChange={handleChange} />
          </div>
          <div className="input-group">
            1루타
            <InputNumber name="1B" value={stats['1B']} onChange={handleChange} />
          </div>
          <div className="input-group">
            2루타
            <InputNumber name="2B" value={stats['2B']} onChange={handleChange} />
          </div>
          <div className="input-group">
            3루타
            <InputNumber name="3B" value={stats['3B']} onChange={handleChange} />
          </div>
          <div className="input-group">
            홈런
            <InputNumber name="hr" value={stats.hr} onChange={handleChange} />
          </div>
        </div>
      </div>
      <hr />

      {/* 아웃 섹션 */}
      <div>
        <div className="input-form">
          <div className="input-group">
            삼진 아웃
            <InputNumber name="so" value={stats.so} onChange={handleChange} />
          </div>
          <div className="input-group">
            땅볼 아웃
            <InputNumber name="go" value={stats.go} onChange={handleChange} />
          </div>
          <div className="input-group">
            뜬공 아웃
            <InputNumber name="fo" value={stats.fo} onChange={handleChange} />
          </div>
          <div className="input-group">
            희생플라이
            <InputNumber name="sf" value={stats.sf || 0} onChange={handleChange} />
          </div>
          <div className="input-group">
            희생번트
            <InputNumber name="sh" value={stats.sh || 0} onChange={handleChange} />
          </div>
        </div>
      </div>

    </div>
  );
});

BatterInput.displayName = 'BatterInput';
export default BatterInput;