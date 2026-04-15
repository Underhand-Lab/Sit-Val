import React, { useState, useImperativeHandle, forwardRef, useEffect } from 'react';

/**
 * RunnerInput 컴포넌트
 * 기존 HTML 템플릿의 레이아웃과 로직을 그대로 유지하며 React로 마이그레이션함.
 */
const RunnerInput = forwardRef(({ onDataChange, id, initialStats }, ref) => {
  const [stats, setStats] = useState({
    passedball: 0.03,
    s_r1_r2_safe: 0.10,
    s_r1_r2_out: 0.03,
    s_r2_r3_safe: 0.004,
    s_r2_r3_out: 0.001,
    '1B_r2_home_safe': 0.40,
    '1B_r2_home_out': 0.05,
    '1B_r2_r3_safe': 0.55,
    '1B_r1_r3_safe': 0.30,
    '1B_r1_r3_out': 0.05,
    '1B_r1_r2_safe': 0.65,
    '2B_r1_home_safe': 0.7,
    '2B_r1_home_out': 0.05,
    '2B_r1_r3_safe': 0.25,
    fo_r3_home_safe: 0.85,
    fo_r3_home_out: 0.05,
    fo_r3_r3_safe: 0.10,
    go_r1_r2_out: 0.3,
    go_b_r1_out: 0.3
  });

  // initialStats prop이 변경될 때마다 내부 stats 상태를 업데이트
  useEffect(() => {
    if (initialStats) {
      setStats(initialStats);
    }
  }, [initialStats]);

  // 외부(TransitionEngine 등)에서 데이터를 가져갈 때 사용하는 인터페이스
  useImperativeHandle(ref, () => ({
    getAbility: () => ({ ...stats }),
    getAbilityRaw: () => ({ ...stats }),
    setData: (newData) => setStats(newData) // 외부에서 stats를 설정할 수 있도록 추가
  }));

  const handleChange = (e) => {
    const { name, value } = e.target;
    const val = parseFloat(value) || 0;
    setStats(prev => ({ ...prev, [name]: val }));
    if (onDataChange) onDataChange({ ...stats, [name]: val }); // 변경된 stats를 즉시 부모에게 전달
  };

  // 나머지 확률(시도 X 등) 계산 함수
  const getRemainder = (safe, out) => (Math.max(0, 1 - safe - out)).toFixed(3);

  return (
    <div id={id} className="runner-input-container" style={{ flex: 1, overflowY: 'auto' }}>
      {/* 폭투 */}
      <div>
        <h3>폭투</h3>
        <div className="input-form">
          <div className="input-group">
            발생율
            <input type="number" name="passedball" className="input_runner_passedball" 
                   value={stats.passedball} onChange={handleChange} step="0.01" min="0" max="1" />
          </div>
        </div>
      </div>
      <hr />

      {/* 1루 주자 2루 도루 */}
      <div>
        <h3>1루 주자 2루 도루</h3>
        <div className="input-form">
          <div className="input-group">
            성공률
            <input type="number" name="s_r1_r2_safe" value={stats.s_r1_r2_safe} onChange={handleChange} step="0.01" />
          </div>
          <div className="input-group">
            실패율
            <input type="number" name="s_r1_r2_out" value={stats.s_r1_r2_out} onChange={handleChange} step="0.01" />
          </div>
        </div>
      </div>
      <hr />

      {/* 2루 주자 3루 도루 */}
      <div>
        <h3>2루 주자 3루 도루</h3>
        <div className="input-form">
          <div className="input-group">
            성공률
            <input type="number" name="s_r2_r3_safe" value={stats.s_r2_r3_safe} onChange={handleChange} step="0.001" />
          </div>
          <div className="input-group">
            실패율
            <input type="number" name="s_r2_r3_out" value={stats.s_r2_r3_out} onChange={handleChange} step="0.001" />
          </div>
        </div>
      </div>
      <hr />

      {/* 단타: 2루 주자 홈 득점 */}
      <div>
        <h3>단타: 2루 주자 홈 득점</h3>
        <div className="input-form">
          <div className="input-group">
            성공률
            <input type="number" name="1B_r2_home_safe" value={stats['1B_r2_home_safe']} onChange={handleChange} step="0.01" />
          </div>
          <div className="input-group">
            실패율
            <input type="number" name="1B_r2_home_out" value={stats['1B_r2_home_out']} onChange={handleChange} step="0.01" />
          </div>
          <div className="input-group">
            시도 X: 
            <b>{getRemainder(stats['1B_r2_home_safe'], stats['1B_r2_home_out'])}</b>
          </div>
        </div>
      </div>
      <hr />

      {/* 단타: 1루 주자 3루 진루 */}
      <div>
        <h3>단타: 1루 주자 3루 진루</h3>
        <div className="input-form">
          <div className="input-group">
            성공률
            <input type="number" name="1B_r1_r3_safe" value={stats['1B_r1_r3_safe']} onChange={handleChange} step="0.01" />
          </div>
          <div className="input-group">
            실패율
            <input type="number" name="1B_r1_r3_out" value={stats['1B_r1_r3_out']} onChange={handleChange} step="0.01" />
          </div>
          <div className="input-group">
            시도 X: 
            <b>{getRemainder(stats['1B_r1_r3_safe'], stats['1B_r1_r3_out'])}</b>
          </div>
        </div>
      </div>
      <hr />

      {/* 2루타: 1루 주자 홈 득점 */}
      <div>
        <h3>2루타: 1루 주자 홈 득점</h3>
        <div className="input-form">
          <div className="input-group">
            성공률
            <input type="number" name="2B_r1_home_safe" value={stats['2B_r1_home_safe']} onChange={handleChange} step="0.01" />
          </div>
          <div className="input-group">
            실패율
            <input type="number" name="2B_r1_home_out" value={stats['2B_r1_home_out']} onChange={handleChange} step="0.01" />
          </div>
          <div className="input-group">
            시도 X: 
            <b>{getRemainder(stats['2B_r1_home_safe'], stats['2B_r1_home_out'])}</b>
          </div>
        </div>
      </div>
      <hr />

      {/* 희생플라이 */}
      <div>
        <h3>희생플라이</h3>
        <div className="input-form">
          <div className="input-group">
            성공률
            <input type="number" name="fo_r3_home_safe" value={stats.fo_r3_home_safe} onChange={handleChange} step="0.01" />
          </div>
          <div className="input-group">
            실패율
            <input type="number" name="fo_r3_home_out" value={stats.fo_r3_home_out} onChange={handleChange} step="0.01" />
          </div>
          <div className="input-group">
            시도 X: 
            <b>{getRemainder(stats.fo_r3_home_safe, stats.fo_r3_home_out)}</b>
          </div>
        </div>
      </div>
      <hr />

      {/* 땅볼: 주자 1루 */}
      <div>
        <h3>땅볼: 주자 1루</h3>
        <div className="input-form">
          <div className="input-group">
            1루주자만 아웃 확률
            <input type="number" name="go_r1_r2_out" value={stats.go_r1_r2_out} onChange={handleChange} step="0.01" />
          </div>
          <div className="input-group">
            타자주자만 아웃 확률
            <input type="number" name="go_b_r1_out" value={stats.go_b_r1_out} onChange={handleChange} step="0.01" />
          </div>
          <div className="input-group">
            병살 확률: 
            <b>{getRemainder(stats.go_r1_r2_out, stats.go_b_r1_out)}</b>
          </div>
        </div>
      </div>
    </div>
  );
});

RunnerInput.displayName = 'RunnerInput';
export default RunnerInput;