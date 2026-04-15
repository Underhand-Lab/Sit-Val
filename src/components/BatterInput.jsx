import React, { useState, useImperativeHandle, forwardRef, useEffect } from 'react';

const BatterInput = forwardRef(({ onDataChange, id, initialStats }, ref) => {
  const [stats, setStats] = useState({
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
  });

  // initialStats prop이 변경될 때마다 내부 stats 상태를 업데이트
  useEffect(() => {
    if (initialStats) {
      setStats(initialStats);
    }
  }, [initialStats]);

  // 지표 기반 자동 계산 로직
  const hits = stats['1B'] + stats['2B'] + stats['3B'] + stats.hr;
  // 뜬공(fo)에 희생플라이(sf)가 포함되어 있으므로 타수(AB) 계산 시 sf를 제외함
  const ab_outs = stats.so + stats.go + (stats.fo - (stats.sf || 0));
  const ab = hits + ab_outs;
  // 타석(PA) = 타수(AB) + 볼넷(BB) + 사구(HBP) + 희플(SF) + 희번(SH)
  const pa = ab + stats.bb + (stats.hbp || 0) + (stats.sf || 0) + (stats.sh || 0);
  const ob = hits + stats.bb + (stats.hbp || 0);
  const tb = stats['1B'] + stats['2B'] * 2 + stats['3B'] * 3 + stats.hr * 4;

  const avg = ab > 0 ? hits / ab : 0;
  const obp = pa > 0 ? ob / pa : 0;
  const slg = ab > 0 ? tb / ab : 0;
  const ops = obp + slg;

  useImperativeHandle(ref, () => ({
    setData: (newData) => setStats(newData),
    getAbilityRaw: () => ({ ...stats, pa }),
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    const val = parseFloat(value) || 0;
    const nextStats = { ...stats, [name]: val };

    // 변경된 시점의 계산된 pa를 함께 부모에게 전달
    const currentHits = nextStats['1B'] + nextStats['2B'] + nextStats['3B'] + nextStats.hr;
    // fo에 sf가 포함되어 있으므로 중복 합산 방지
    const currentPa = currentHits + nextStats.so + nextStats.go + nextStats.fo + nextStats.bb + (nextStats.hbp || 0) + (nextStats.sh || 0);

    setStats(nextStats);
    if (onDataChange) onDataChange({ ...nextStats, pa: currentPa });
  };

  return (
    <div
      id={id}
      className="batter-input-container"
      style={{ flex: 1, overflowY: 'auto' }}
    >

      <div style={{display: 'flex', flexDirection: 'column', padding: '20px', gap: '20px'}}>
        <div style={{display: 'flex', flexDirection: 'row', flexWrap: 'wrap',
            justifyContent: 'center', gap: '15px'
        }}>
          <div >타석: {pa}</div>
          <div >타수: {ab}</div>
          <div >안타: {hits}</div>
          <div >출루: {ob}</div>
          <div >장타수: {tb}</div>
        </div>
        <div style={{display: 'flex', flexDirection: 'row', flexWrap: 'wrap',
            justifyContent: 'center', gap: '15px'
        }}>
            <div >타율: {avg.toFixed(3)}</div>
            <div >출루율: {obp.toFixed(3)}</div>
            <div >장타율: {slg.toFixed(3)}</div>
            <div >OPS: {ops.toFixed(3)}</div>
        </div>
      </div>
      <hr/>

      {/* 안타 섹션 */}
      <div>
        <div className="input-form">
          <div className="input-group">
            볼넷
            <input type="number" name="bb" value={stats.bb} onChange={handleChange} />
          </div>
          <div className="input-group">
            사구(HBP)
            <input type="number" name="hbp" value={stats.hbp || 0} onChange={handleChange} />
          </div>
          <div className="input-group">
            1루타
            <input type="number" name="1B" value={stats['1B']} onChange={handleChange} />
          </div>
          <div className="input-group">
            2루타
            <input type="number" name="2B" value={stats['2B']} onChange={handleChange} />
          </div>
          <div className="input-group">
            3루타
            <input type="number" name="3B" value={stats['3B']} onChange={handleChange} />
          </div>
          <div className="input-group">
            홈런
            <input type="number" name="hr" value={stats.hr} onChange={handleChange} />
          </div>
        </div>
      </div>
      <hr />

      {/* 아웃 섹션 */}
      <div>
        <div className="input-form">
          <div className="input-group">
            삼진 아웃
            <input type="number" name="so" value={stats.so} onChange={handleChange} className="neumorphism-input" />
          </div>
          <div className="input-group">
            땅볼 아웃
            <input type="number" name="go" value={stats.go} onChange={handleChange} className="neumorphism-input" />
          </div>
          <div className="input-group">
            뜬공 아웃
            <input type="number" name="fo" value={stats.fo} onChange={handleChange} className="neumorphism-input" />
          </div>
          <div className="input-group">
            희생플라이
            <input type="number" name="sf" value={stats.sf || 0} onChange={handleChange} className="neumorphism-input" />
          </div>
          <div className="input-group">
            희생번트
            <input type="number" name="sh" value={stats.sh || 0} onChange={handleChange} className="neumorphism-input" />
          </div>
        </div>
      </div>
      <hr />

    </div>
  );
});

BatterInput.displayName = 'BatterInput';
export default BatterInput;