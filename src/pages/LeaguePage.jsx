import React, { useState, useEffect, useRef } from 'react'
import * as TransitionEngine from '../lib/sit-val/transition-engine/index.js'
import * as Calc from "@/lib/sabermetrics/calc.js";
import { calculateRE } from '../features/league/api/re-league.js';

import VisualizerBox from '../components/VisualizerBox';
import Visualizer9RE from '../features/league/components/Visualizer9RE';
import RE24Visualizer from '../features/league/components/RE24Visualizer';
import LeagueVisualizer from '../features/league/components/LeagueVisualizer';
import RunValueVisualizer from '../features/league/components/RunValueVisualizer';
import LeagueBigInningVisualizer from '../features/league/components/LeagueBigInningVisualizer';
import PersonalVisualizer from '../features/league/components/PersonalVisualizer.jsx'
import BatterInput from '../components/BatterInput';
import RunnerInput from '../components/RunnerInput';
import Popup from '../components/Popup'; // Import the new Popup component
import BottomSheet from '../components/BottomSheet';

function LeaguePage() {
  const batterRef = useRef(null)
  const runnerRef = useRef(null)
  const transitionEngine = new TransitionEngine.Standard()

  // 바텀 시트 열림 상태 관리
  const [isBatterOpen, setIsBatterOpen] = useState(false);
  const [isRunnerOpen, setIsRunnerOpen] = useState(false);
  const [isToolMenuOpen, setIsToolMenuOpen] = useState(false);

  // 리그 기본 타자 능력치 (초기값)
  const [leagueBatterStats, setLeagueBatterStats] = useState({
    '1B': 65, '2B': 23, '3B': 0, hr: 56,
    bb: 111, so: 89, go: 117, fo: 135,
    sf: 6, sh: 0, hbp: 0
  });

  // 리그 기본 주자 능력치 (초기값)
  const [leagueRunnerStats, setLeagueRunnerStats] = useState({
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
    go_r1_r2_out: 0.3, go_b_r1_out: 0.3
  });

  // 상태 관리: 시각화 도구 리스트와 계산 결과 데이터
  const [activeTools, setActiveTools] = useState([
    { id: 1, Component: Visualizer9RE },
    { id: 2, Component: RE24Visualizer },
    { id: 3, Component: LeagueVisualizer },
    { id: 4, Component: RunValueVisualizer },
    { id: 5, Component: PersonalVisualizer },
  ])
  const [vizData, setVizData] = useState(null)

  const addTool = (Component) => {
    setActiveTools(prev => [...prev, { id: Date.now(), Component }]);
    setIsToolMenuOpen(false);
  }

  // Helper function to calculate batter abilities from raw stats
  // This logic mirrors the getAbility method in BatterInput.jsx
  const calculateBatterAbilityFromRawStats = (rawStats) => {
    const hits = (rawStats['1B'] || 0) + (rawStats['2B'] || 0) + (rawStats['3B'] || 0) + (rawStats.hr || 0);
    // FO에 SF가 포함된 기준의 PA 계산 로직 적용
    const calculatedPa = hits + (rawStats.so || 0) + (rawStats.go || 0) + (rawStats.fo || 0) + 
                         (rawStats.bb || 0) + (rawStats.hbp || 0) + (rawStats.sh || 0);
    const pa = Math.max(1, rawStats.pa || calculatedPa);
    return {
      '1B': rawStats['1B'] / pa,
      '2B': rawStats['2B'] / pa,
      '3B': rawStats['3B'] / pa,
      hr: rawStats.hr / pa,
      bb: rawStats.bb / pa,
      so: rawStats.so / pa,
      go: rawStats.go / pa,
      fo: rawStats.fo / pa,
    };
  };

  // BatterInput에서 데이터 변경 시 호출될 콜백
  const handleLeagueBatterDataChange = (newStats) => {
    setLeagueBatterStats(newStats);
  };

  // RunnerInput에서 데이터 변경 시 호출될 콜백
  const handleLeagueRunnerDataChange = (newStats) => {
    setLeagueRunnerStats(newStats);
  };

  const execute = () => {
    // BatterInput과 RunnerInput에서 onDataChange를 통해 업데이트된 상태를 직접 사용
    const hits = (leagueBatterStats['1B'] || 0) + (leagueBatterStats['2B'] || 0) + (leagueBatterStats['3B'] || 0) + (leagueBatterStats.hr || 0);
    const calculatedPa = hits + (leagueBatterStats.so || 0) + (leagueBatterStats.go || 0) + (leagueBatterStats.fo || 0) + 
                         (leagueBatterStats.bb || 0) + (leagueBatterStats.hbp || 0) + (leagueBatterStats.sh || 0);
    const validPa = Math.max(1, leagueBatterStats.pa || calculatedPa);

    const batterAbility = calculateBatterAbilityFromRawStats({ ...leagueBatterStats, pa: validPa }); // raw stats를 ability로 변환
    const runnerAbility = leagueRunnerStats; // RunnerInput의 stats는 이미 ability 형태
    const leagueBatter = { ...leagueBatterStats, pa: validPa }; // pa가 포함된 완전한 raw stats 객체 생성

    const ret = calculateRE(batterAbility, runnerAbility, transitionEngine)

    const weights = Calc.calculateWeightedRunValue(leagueBatter, ret['runValue']);
    const lgWobaRaw = Calc.calculateCustomWOBA(weights, leagueBatter);
    const wOBAScale = 0.33 / lgWobaRaw;
    const runPerPa = Calc.calculateLeagueRunPerPA(ret['R'][0][0], leagueBatter);

    setVizData([ret, weights, lgWobaRaw, wOBAScale, runPerPa]);
  };

  // 데이터가 변경될 때마다 자동으로 분석(execute) 실행
  useEffect(() => {
    execute();
  }, [leagueBatterStats, leagueRunnerStats]);

  return (
    <>
      <div id="wrapper">

        <div id="boxes">
          {activeTools.map(tool => (
            <VisualizerBox key={tool.id} onRemove={() => setActiveTools(prev => prev.filter(t => t.id !== tool.id))}>
              <tool.Component data={vizData} />
            </VisualizerBox>
          ))}
        </div>

        {/* 리그 타격 기록 설정 바텀 시트 */}
        <BottomSheet
          isOpen={isBatterOpen}
          onClose={() => setIsBatterOpen(false)}
          title="리그 타격 기록 설정"
        >
          <BatterInput
            ref={batterRef}
            id="batter-league"
            initialStats={leagueBatterStats} // LeaguePage의 상태를 초기값으로 전달
            onDataChange={handleLeagueBatterDataChange} // 변경된 값을 LeaguePage 상태에 반영
          />
        </BottomSheet>

        {/* 리그 주자 능력 설정 바텀 시트 */}
        <BottomSheet
          isOpen={isRunnerOpen}
          onClose={() => setIsRunnerOpen(false)}
          title="리그 주자 능력 설정"
        >
          <RunnerInput
            ref={runnerRef}
            id="runner-league"
            initialStats={leagueRunnerStats} // LeaguePage의 상태를 초기값으로 전달
            onDataChange={handleLeagueRunnerDataChange} // 변경된 값을 LeaguePage 상태에 반영
          />
        </BottomSheet>

        {/* 도구 선택 팝업 (Popup 컴포넌트 사용) */}
        <Popup
          isOpen={isToolMenuOpen}
          onClose={() => setIsToolMenuOpen(false)}
          title="분석 도구 추가"
        >
          <div className="tool-grid"> {/* Add tool-grid class for styling */}
            <button onClick={() => addTool(Visualizer9RE)}>9RE (기대 득점)</button>
            <button onClick={() => addTool(RE24Visualizer)}>RE24 상황판</button>
            <button onClick={() => addTool(LeagueVisualizer)}>리그 확장 지표</button>
            <button onClick={() => addTool(RunValueVisualizer)}>타구 가치 분석</button>
            <button onClick={() => addTool(PersonalVisualizer)}>리그 개인 가치</button>
            <button onClick={() => addTool(LeagueBigInningVisualizer)}>빅이닝 확률</button>
          </div>
        </Popup>
      </div>

      <div className="slider">
        <div className="container neumorphism">
          <div style={{ display: 'flex', flexWrap: 'nowrap', justifyContent: 'center', overflow: 'auto' }}>
            <div style={{ display: 'flex', flexWrap: 'nowrap', justifyContent: 'left', flexGrow: 1, gap: '10px' }}>
              <button onClick={() => setIsBatterOpen(true)} style={{ textWrap: 'nowrap' }}>
                리그 타격 기록 설정
              </button>
              <button onClick={() => setIsRunnerOpen(true)} style={{ textWrap: 'nowrap' }}>
                리그 주자 능력 설정
              </button>
            </div>
            <div>
              <button onClick={() => setIsToolMenuOpen(true)} style={{ textWrap: 'nowrap' }}>
                분석 도구
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
export default LeaguePage