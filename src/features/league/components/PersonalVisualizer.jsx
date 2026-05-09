import React, { useState, useRef, useEffect } from 'react';
import BatterInput from '../../../common/components/BatterInput.jsx';
import BottomSheet from '../../../common/components/BottomSheet.jsx';
import { Box, Div, H3, Button } from '../../../common/components/ui/UI.jsx';


const PersonalVisualizer = ({ data }) => {
  if (!data || !data[0] || !data[1]) return null;
  // data 구조: [ret, weights, lgWobaRaw, wOBAScale, runPerPa]
  const [ret, weights, lgWobaRaw, wOBAScale, runPerPa] = data;

  const [batterStats, setBatterStats] = useState({
    '1B': 65, '2B': 23, '3B': 0, hr: 56,
    bb: 111, so: 89, go: 117, fo: 135,
    sf: 6, sh: 0, hbp: 0, pa: 596
  });

  const [isBatterOpen, setIsBatterOpen] = useState(false);

  const batterRef = useRef();

  // 초기 로드시 BatterInput의 기본값을 가져와 상태를 설정합니다.
  useEffect(() => {
    if (batterRef.current) {
      setBatterStats(batterRef.current.getAbilityRaw());
    }
  }, []);

  const handleBatterChange = (newStats) => {
    setBatterStats(newStats);
  };

  // 1. 표준 wOBA 계산 (Raw)
  const calculateWoba = () => {
    if (!weights || !batterStats) return 0;
    const { bb, hbp, '1B': b1, '2B': b2, '3B': b3, hr, pa } = batterStats;
    if (pa === 0) return 0;
    const numerator =
      (bb * (weights.bb || 0)) +
      ((hbp || 0) * (weights.hbp || 0)) +
      (b1 * (weights['1B'] || 0)) +
      (b2 * (weights['2B'] || 0)) +
      (b3 * (weights['3B'] || 0)) +
      (hr * (weights.hr || 0));
    return numerator / pa;
  };

  // 2. 커스텀 wRAA 계산 (모델의 runValue 직접 사용)
  const calculateCustomWraa = () => {
    if (!ret?.runValue || !batterStats) return 0;
    const rv = ret.runValue;
    // 각 이벤트별 가치 합산 (삼진, 땅볼, 플라이 포함)
    const events = ['bb', 'hbp', '1B', '2B', '3B', 'hr', 'so', 'go', 'fo'];
    return events.reduce((acc, event) => {
      return acc + (batterStats[event] || 0) * (rv[event]?.value || 0);
    }, 0);
  };

  const personalWoba = calculateWoba();
  const personalWobaScaled = personalWoba * wOBAScale;

  // wRAA (표준): (wOBA - 리그wOBA) / wOBAScale * PA
  const wraa = wOBAScale > 0 ? ((personalWoba - lgWobaRaw) / wOBAScale) * (batterStats.pa || 0) : 0;

  // wRAA (커스텀): 모델 전이 확률 기반 기대 득점 변화 합계
  const wraaCustom = calculateCustomWraa();

  // wRC+ 계산: ((wRAA / PA) / 리그R/PA + 1) * 100
  const calculateWrcPlus = (currentWraa, currentRunPerPa) => {
    if (!batterStats.pa || !currentRunPerPa) return 0;
    return ((currentWraa / batterStats.pa) / currentRunPerPa + 1) * 100;
  };

  const wrcPlus = calculateWrcPlus(wraa, runPerPa);

  // 커스텀 R/PA 처리 (배열인 경우 첫 번째 값 사용)
  const customRunPerPa = Array.isArray(ret['R_PA_Custom']) ? ret['R_PA_Custom'][0] : ret['R_PA_Custom'];
  const wrcPlusCustom = calculateWrcPlus(wraaCustom, customRunPerPa);

  return (
    <Div className="result-personal">
      <H3 style={{ margin: '0 0 10px 0' }}>개인 타격 가치</H3>

      <Div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
        {/* 메인 지표: wOBA 및 wRC+ */}
        <Box>
          <Div style={{ padding: '10px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', textAlign: 'center' }}>
            <Div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.85em', color: '#666', display: 'block', marginBottom: '5px' }}>가중 출루율 (wOBA)</span>
              <Div style={{ fontSize: '1.6em', fontWeight: 'bold', color: '#e74c3c' }}>
                {personalWobaScaled.toFixed(3)}
              </Div>
            </Div>
            <Div style={{ height: '40px', width: '1px', background: '#ddd' }}></Div>
            <Div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.85em', color: '#666', display: 'block', marginBottom: '5px' }}>득점 창출력 (wRC+)</span>
              <Div style={{ fontSize: '1.6em', fontWeight: 'bold', color: '#2c3e50' }}>
                {Math.round(wrcPlus)}
              </Div>
            </Div>
          </Div>

        </Box>

        {/* 상세 분석 지표: wRAA 및 커스텀 지표 */}
        <Box>
          <Div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <Div style={{ textAlign: 'center', padding: '10px', borderRight: '1px solid #eee' }}>
              <span style={{ fontSize: '0.8em', color: '#888' }}>wRAA (표준)</span>
              <Div style={{ fontSize: '1.2em', fontWeight: 'bold', color: wraa >= 0 ? '#e74c3c' : '#3498db' }}>
                {wraa > 0 ? '+' : ''}{wraa.toFixed(2)}
              </Div>
            </Div>
            <Div style={{ textAlign: 'center', padding: '10px' }}>
              <span style={{ fontSize: '0.8em', color: '#888' }}>wRAA (커스텀)</span>
              <Div style={{ fontSize: '1.2em', fontWeight: 'bold', color: wraaCustom >= 0 ? '#e74c3c' : '#3498db' }}>
                {wraaCustom > 0 ? '+' : ''}{wraaCustom.toFixed(2)}
              </Div>
            </Div>
            <Div style={{ textAlign: 'center', padding: '10px', borderRight: '1px solid #eee', borderTop: '1px solid #eee' }}>
              <span style={{ fontSize: '0.8em', color: '#888' }}>wRC+ (커스텀)</span>
              <Div style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#2c3e50' }}>
                {Math.round(wrcPlusCustom)}
              </Div>
            </Div>
            <Div style={{ textAlign: 'center', padding: '10px', borderTop: '1px solid #eee' }}>
              <span style={{ fontSize: '0.8em', color: '#888' }}>타석당 득점 가치</span>
              <Div style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#2c3e50' }}>
                {(wraaCustom / (batterStats.pa || 1)).toFixed(3)}
              </Div>
            </Div>
          </Div>
        </Box>
        <p style={{ fontSize: '0.75em', color: '#999', marginTop: '15px', textAlign: 'center', lineHeight: '1.4' }}>
          ※ 커스텀 지표는 모델이 계산한 상황별 득점 가치 변화(runValue)를 직접 반영하며,<br />
          wRC+는 리그 평균 득점 환경(R/PA: {runPerPa.toFixed(3)}) 대비 생산성을 나타냅니다.
        </p>
      </Div>

      <Button
        className="neumorphism-Button"
        onClick={() => setIsBatterOpen(true)}
      >
        대상 선수 성적 수정
      </Button>

      <BottomSheet
        isOpen={isBatterOpen}
        onClose={() => setIsBatterOpen(false)}
        title="대상 타자 성적 설정"
      >
        <BatterInput
          ref={batterRef}
          initialStats={batterStats}
          onDataChange={handleBatterChange}
          id="personal-batter-analysis-input"
        />
      </BottomSheet>
    </Div>
  );
};

export default PersonalVisualizer;