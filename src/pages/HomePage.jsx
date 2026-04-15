import React from 'react'
import '../lib/easy-h/module/import-markdown.js'

function HomePage() {
  return (
    <div id="wrapper" style={{ paddingBottom: '10px' }}>
      <div className="container neumorphism">
        <h1>🚩 소개</h1>
        <hr/>
        <p>Sit-Val은 Situation-based Value model의 약어로, 야구 경기에서 발생하는 타격 결과를 주자, 아웃, 득점 상태를 포함한 상황으로 해석하고, 각 결과가 만들어내는 기대 득점 변화를 정량화하는 모델입니다.</p>
        <p>주자의 능력(조건부 확률)을 기반으로 타격 결과에 따른 주자 상태, 아웃 카운트, 득점 상태의 전이를 모델링하고, 상태 전이 모델과 타격 결과 분포를 이용하여 각 상황에서의 기대 득점(Expected Runs) 계산합니다. 계산된 기대 득점을 기반으로 다양한 분석 기능을 제공합니다.</p>
      </div>
      <div className="container neumorphism">
        <h1 id="-">📞 연락</h1>
        <hr />
        <p>추가 기능 제안, 오류 제보, 기타 문의 등은 아래의 이메일 주소로 보내주시길 바랍니다.</p>
        <ul>
          <li>✉︎: skysea001010@naver.com</li>
        </ul>
        <hr />
        <p>다른 프로젝트를 보고 싶다면 아래의 링크에서 확인해주세요.</p>
        <ul>
          <li><a href="https://underhand-lab.github.io/">Underhand-Lab</a></li>
        </ul>

      </div>
    </div>
  )
}
export default HomePage