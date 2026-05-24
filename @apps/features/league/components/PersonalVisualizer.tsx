import React, { useState, useRef, useEffect } from 'react';
import BatterInput, { BatterInputHandle } from '@sit-val/components/BatterInput';
import { Box, Div, H3, Button, BottomSheet, vars } from '@shared/bridges/UIBridge';
import { BatterStatsData } from '@sit-val/types/BatterStats';
import { RECalculationResult } from '../api/re-league';
import { WOBAWeights } from '@sit-val/lib/sabermetrics/calc';

interface PersonalVisualizerProps {
  data: [RECalculationResult, WOBAWeights, number, number, number] | null;
}

const PersonalVisualizer: React.FC<PersonalVisualizerProps> = ({ data }) => {
  const [batterStats, setBatterStats] = useState<BatterStatsData>({
    '1B': 65, '2B': 23, '3B': 0, hr: 56,
    bb: 111, so: 89, go: 117, fo: 135,
    sf: 6, sh: 0, hbp: 0, pa: 596
  });

  const [isBatterOpen, setIsBatterOpen] = useState(false);
  const batterRef = useRef<BatterInputHandle>(null);

  if (!data || !data[0] || !data[1]) return null;
  const [ret, weights, lgWobaRaw, wOBAScale, runPerPa] = data;

  // 컴포넌트 마운트 시 초기 데이터를 가져오는 로직 (필요한 경우)
  // 이 로직은 sheet가 열려있을 때만 유효하므로 현재는 batterStats의 초기값 설정으로 대체되었습니다.

  const handleBatterChange = (newStats: BatterStatsData) => {
    setBatterStats(newStats);
  };

  const calculateWoba = () => {
    if (!weights || !batterStats) return 0;
    const { bb, hbp, '1B': b1, '2B': b2, '3B': b3, hr, pa } = batterStats;
    if (!pa) return 0;
    const numerator =
      (bb * (weights.bb || 0)) +
      ((hbp || 0) * (weights.hbp || 0)) +
      (b1 * (weights['1B'] || 0)) +
      (b2 * (weights['2B'] || 0)) +
      (b3 * (weights['3B'] || 0)) +
      (hr * (weights.hr || 0));
    return numerator / pa;
  };

  const calculateCustomWraa = () => {
    if (!ret?.runValue || !batterStats) return 0;
    const rv = ret.runValue;
    const events = ['bb', 'hbp', '1B', '2B', '3B', 'hr', 'so', 'go', 'fo'];
    return events.reduce((acc, event) => {
      return acc + (batterStats[event] || 0) * (rv[event]?.value || 0);
    }, 0);
  };

  const personalWoba = calculateWoba();
  const personalWobaScaled = personalWoba * wOBAScale;
  const wraa = wOBAScale > 0 ? ((personalWoba - lgWobaRaw) / wOBAScale) * (batterStats.pa || 0) : 0;
  const wraaCustom = calculateCustomWraa();

  const calculateWrcPlus = (currentWraa: number, currentRunPerPa: number) => {
    if (!batterStats.pa || !currentRunPerPa) return 0;
    return ((currentWraa / batterStats.pa) / currentRunPerPa + 1) * 100;
  };

  const wrcPlus = calculateWrcPlus(wraa, runPerPa);
  const customRunPerPa = Array.isArray(ret['R_PA_Custom']) ? ret['R_PA_Custom'][0] : ret['R_PA_Custom'];
  const wrcPlusCustom = calculateWrcPlus(wraaCustom, customRunPerPa || 0);

  return (
    <Div className="result-personal">
      <H3 style={{ margin: '0 0 10px 0' }}>개인 타격 가치</H3>
      <Div style={{display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px'}}>
        <Box>
          <Div style={{ padding: '10px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', textAlign: 'center' }}>
            <Div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.85em', display: 'block', marginBottom: '5px' }}>가중 출루율 (wOBA)</span>
              <Div style={{ fontSize: '1.6em', fontWeight: 'bold', color: '#e74c3c' }}>
                {personalWobaScaled.toFixed(3)}
              </Div>
            </Div>
            <Div style={{ height: '40px', width: '1px', background: '#ddd' }}></Div>
            <Div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.85em', display: 'block', marginBottom: '5px' }}>득점 창출력 (wRC+)</span>
              <Div style={{ fontSize: '1.6em', fontWeight: 'bold', color: vars.primary }}>
                {Math.round(wrcPlus)}
              </Div>
            </Div>
          </Div>
        </Box>

        <Box>
          <Div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', }}>
            <Div style={{ textAlign: 'center', padding: '10px', borderRight: '1px solid #eee' }}>
              <span style={{ fontSize: '0.8em' }}>wRAA (표준)</span>
              <Div style={{ fontSize: '1.2em', fontWeight: 'bold', color: wraa >= 0 ? '#e74c3c' : '#3498db' }}>
                {wraa > 0 ? '+' : ''}{wraa.toFixed(2)}
              </Div>
            </Div>
            <Div style={{ textAlign: 'center', padding: '10px' }}>
              <span style={{ fontSize: '0.8em' }}>wRAA (커스텀)</span>
              <Div style={{ fontSize: '1.2em', fontWeight: 'bold', color: wraaCustom >= 0 ? '#e74c3c' : '#3498db' }}>
                {wraaCustom > 0 ? '+' : ''}{wraaCustom.toFixed(2)}
              </Div>
            </Div>
            <Div style={{ textAlign: 'center', padding: '10px', borderRight: '1px solid #eee', borderTop: '1px solid #eee' }}>
              <span style={{ fontSize: '0.8em', }}>wRC+ (커스텀)</span>
              <Div style={{ fontSize: '1.2em', fontWeight: 'bold', color: vars.primary }}>
                {Math.round(wrcPlusCustom)}
              </Div>
            </Div>
            <Div style={{ textAlign: 'center', padding: '10px', borderTop: '1px solid #eee' }}>
              <span style={{ fontSize: '0.8em', }}>타석당 득점 가치</span>
              <Div style={{ fontSize: '1.2em', fontWeight: 'bold', color: vars.primary }}>
                {(wraaCustom / (batterStats.pa || 1)).toFixed(3)}
              </Div>
            </Div>
          </Div>
        </Box>
      </Div>

      <Button className="neumorphism-Button" onClick={() => setIsBatterOpen(true)}>
        대상 선수 성적 수정
      </Button>

      <BottomSheet isOpen={isBatterOpen} onClose={() => setIsBatterOpen(false)} title="대상 타자 성적 설정">
        <BatterInput ref={batterRef} initialStats={batterStats} onDataChange={handleBatterChange} id="personal-batter-analysis-input" />
      </BottomSheet>
    </Div>
  );
};

export default PersonalVisualizer;