import React from 'react';

const Lineup9RE = ({ data }) => {
  if (!data || !data[0]) return null;
  const ret = data[0];

  // 기존 바닐라의 visualize9RE 로직: 타순별 시작 확률을 고려한 총 합산
  let total_re_9 = 0;
  if (ret.R && ret.leadoff_vector) {
    for (let i = 0; i < 9; i++) {
      // ret.R[i][0]는 i번 타자 시작 시 1이닝 기대득점
      total_re_9 += ret['R'][i][0] * ret['leadoff_vector'][i];
    }
  }

  return (
    <div className="result-9re">
      <div className="final-score" style={{ marginTop: '15px', fontSize: '1.2em', fontWeight: 'bold', color: '#2c3e50' }}>
        <p>⚾ 
          <e-text key="label-team-expected-runs-per-9-innings">
            9이닝당 팀 기대 득점
          </e-text>:
          <span style={{ color: '#e74c3c', marginLeft: '5px' }}>
            {total_re_9.toFixed(3)}
          </span>
        </p>
      </div>
    </div>
  );
};

export default Lineup9RE;