import React, { useState, useEffect, useRef, useCallback } from 'react'
import { calculateLineupRE } from '../features/lineup/api/re-line-up.js'

import VisualizerBox from '../components/VisualizerBox'
import LeadoffVisualizer from '../features/league/components/LeadoffVisualizer'
import Lineup9RE from '../features/lineup/components/Lineup9RE'
import LineupRE24 from '../features/lineup/components/LineupRE24'
import BigInningVisualizer from '../features/league/components/BigInningVisualizer'
import BatterInput from '../components/BatterInput'
import RunnerInput from '../components/RunnerInput'
import BottomSheet from '../components/BottomSheet'

function LineupPage() {
  const batterRef = useRef(null)
  const runnerRef = useRef(null)

  // 상태 관리
  const [activeTools, setActiveTools] = useState([
    { id: 1, Component: (props) => <Lineup9RE {...props} /> },
    { id: 2, Component: (props) => <LineupRE24 {...props} /> },
  ])
  const [vizData, setVizData] = useState(null)

  // 선수 및 타순 상태
  const [players, setPlayers] = useState([
    {
      id: 1, name: '이승엽',
      '1B': 65, '2B': 23, '3B': 0, hr: 56,
      bb: 111, so: 89, go: 117, fo: 135,
      sf: 6, sh: 0, hbp: 0
    },
    ...Array.from({ length: 8 }, (_, i) => ({
      id: i + 2, name: `선수 ${i + 2}`, '1B': 150, '2B': 40, '3B': 5, hr: 20, bb: 100, so: 200, go: 250, fo: 235, sf: 0, sh: 0, hbp: 0
    }))
  ]);
  const [lineup, setLineup] = useState([1, 2, 3, 4, 5, 6, 7, 8, 9]); // Player IDs

  // 주자 설정 상태 관리 (초기값)
  const [lineupRunnerStats, setLineupRunnerStats] = useState({
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

  // 시트 열림 상태
  const [isPlayerListOpen, setPlayerListOpen] = useState(false);
  const [isLineupEditOpen, setLineupEditOpen] = useState(false);
  const [isRunnerOpen, setRunnerOpen] = useState(false);
  const [isBatterEditOpen, setBatterEditOpen] = useState(false);
  const [isToolMenuOpen, setIsToolMenuOpen] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState(null);
  const [editingPlayerStats, setEditingPlayerStats] = useState(null); // New state for player stats being edited

  const addTool = (Component, extraProps = {}) => {
    setActiveTools(prev => [
      ...prev,
      { id: Date.now(), Component: (props) => <Component {...props} {...extraProps} /> }
    ]);
    setIsToolMenuOpen(false);
  }

  const execute = useCallback(() => {
    const lineupAbilities = lineup.map(id => {
      const p = players.find(player => player.id === id);
      // 하드코딩된 p.pa 대신 입력된 스탯 기반으로 정확한 PA 계산 (FO에 SF 포함 가정)
      const hits = p['1B'] + p['2B'] + p['3B'] + p.hr;
      const pa = Math.max(1, hits + p.bb + (p.hbp || 0) + p.so + p.go + p.fo + (p.sh || 0));
      return {
        '1B': p['1B'] / pa, '2B': p['2B'] / pa, '3B': p['3B'] / pa,
        hr: p.hr / pa, bb: p.bb / pa, so: p.so / pa, go: p.go / pa, fo: p.fo / pa,
      };
    });

    const ret = calculateLineupRE(lineupAbilities, lineupRunnerStats);
    setVizData([ret]);
  }, [players, lineup, lineupRunnerStats]);

  useEffect(() => {
    execute();
  }, [execute]);

  // 선수 추가
  const handleAddPlayer = () => {
    const newId = Math.max(...players.map(p => p.id)) + 1;
    const newPlayer = { ...players[0], id: newId, name: `새 선수 ${newId}` };
    setPlayers([...players, newPlayer]);
    startEditPlayer(newPlayer); // 생성 즉시 편집 시트 오픈
  };

  // 선수 편집 시작
  const startEditPlayer = (player) => {
    setEditingPlayerId(player.id);
    setEditingPlayerStats(player); // Set the stats for the player being edited
    setBatterEditOpen(true);
  };

  // 타자 데이터 변경 저장
  const handleBatterDataChange = (updatedStats) => { // BatterInput에서 직접 updatedStats를 받음
    if (!editingPlayerId) return;
    // updatedStats는 이미 BatterInput에서 넘어온 최신 raw stats
    setPlayers(prev => prev.map(p => p.id === editingPlayerId ? { ...updatedStats, id: p.id, name: p.name } : p));
  };

  // 주자 데이터 변경 저장
  const handleRunnerDataChange = (updatedStats) => {
    setLineupRunnerStats(updatedStats);
  };

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

        {/* 도구 선택 팝업 */}
        <div className={`bottom-sheet-overlay ${isToolMenuOpen ? 'active' : ''}`} onClick={() => setIsToolMenuOpen(false)} />
        <div className={`center-popup ${isToolMenuOpen ? 'active' : ''}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3>분석 도구 추가</h3>
            <button onClick={() => setIsToolMenuOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
          </div>
          <div className="tool-grid">
            <button className="neumorphism-button" onClick={() => addTool(LeadoffVisualizer)}>선두타자 분석</button>
            <button className="neumorphism-button" onClick={() => addTool(Lineup9RE)}>팀 기대 득점</button>
            <button className="neumorphism-button" onClick={() => addTool(LineupRE24)}>팀 RE24</button>
            <button className="neumorphism-button" onClick={() => addTool(BigInningVisualizer, { isLineup: true })}>빅이닝 확률</button>
          </div>
        </div>

        {/* 선수 명단 바텀 시트 */}
        <BottomSheet
          isOpen={isPlayerListOpen}
          onClose={() => setPlayerListOpen(false)}
          title="선수 명단"
        >
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {players.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #eee' }}>
                <span>{p.name}</span>
                <button style={{ padding: '5px 10px' }} onClick={() => startEditPlayer(p)}>편집</button>
              </div>
            ))}
          </div>
          <button style={{ width: '100%', marginTop: '15px' }} onClick={handleAddPlayer}>선수 추가</button>
        </BottomSheet>

        {/* 타순 설정 바텀 시트 */}
        <BottomSheet
          isOpen={isLineupEditOpen}
          onClose={() => setLineupEditOpen(false)}
          title="타순 설정"
        >
          <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '20px' }}>
            {lineup.map((playerId, idx) => (
              <div key={idx} style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ minWidth: '60px' }}>{idx + 1}번 타자</span>
                <select
                  value={playerId}
                  onChange={(e) => {
                    const newLineup = [...lineup];
                    newLineup[idx] = parseInt(e.target.value);
                    setLineup(newLineup);
                  }}
                  style={{ flex: 1, padding: '8px' }}
                >
                  {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            ))}
          </div>
          <button style={{ width: '100%', marginTop: '10px' }} onClick={() => setLineupEditOpen(false)}>확인</button>
        </BottomSheet>

        {/* 주자 설정 바텀 시트 */}
        <BottomSheet
          isOpen={isRunnerOpen}
          onClose={() => setRunnerOpen(false)}
          title="주자 설정"
        >
          <RunnerInput
            ref={runnerRef}
            initialStats={lineupRunnerStats}
            onDataChange={handleRunnerDataChange}
          />
        </BottomSheet>

        {/* 타자 편집 바텀 시트 */}
        <BottomSheet
          isOpen={isBatterEditOpen}
          onClose={() => setBatterEditOpen(false)}
          title="타자 정보 편집"
        >
          <BatterInput
            ref={batterRef}
            initialStats={editingPlayerStats} // Pass the stats to BatterInput
            onDataChange={handleBatterDataChange}
          />
        </BottomSheet>

        <style>{`
        .center-popup {
          position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
          background: #f8f9fa; z-index: 1100; padding: 25px; border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2); width: 90%; max-width: 400px;
          display: none;
        }
        .center-popup.active { display: block; }
        .tool-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .tool-grid button { width: 100%; }
        
        /* 주자 설정 슬라이더 스타일 유지 */
        input[type='range'] {
          -webkit-appearance: none;
          height: 8px;
          background: #e0e0e0;
          border-radius: 5px;
          box-shadow: inset 2px 2px 5px #bebebe, inset -2px -2px 5px #ffffff;
          width: 100%;
        }
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px; height: 20px;
          background: #f0f0f0;
          border-radius: 50%;
          box-shadow: 2px 2px 5px #bebebe, -2px -2px 5px #ffffff;
          cursor: pointer;
          border: 1px solid #ddd;
        }
      `}</style>
      </div>

      <div className="slider">
        <div className="container neumorphism" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="neumorphism-button" onClick={() => setPlayerListOpen(true)}>선수 명단</button>
          <button className="neumorphism-button" onClick={() => setLineupEditOpen(true)}>타순 설정</button>
          <button className="neumorphism-button" onClick={() => setRunnerOpen(true)}>주자 설정</button>
          <button className="neumorphism-button" onClick={() => setIsToolMenuOpen(true)} style={{ marginLeft: 'auto' }}>도구 추가</button>
        </div>
      </div>
    </>
  )
}

export default LineupPage