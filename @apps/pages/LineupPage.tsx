import React, { useState, useEffect, useRef, useCallback } from 'react'

import Popup from '@shared/components/Modal'; // Popup 컴포넌트 임포트
import { Box, Div, H3, Button, FixedFooter, BottomSheet } from '@shared/bridges/UIBridge';

import VisualizerBox from '@sit-val/components/VisualizerBox'
import BatterInput, { BatterInputHandle } from '@sit-val/components/BatterInput'
import RunnerInput, { RunnerInputHandle } from '@sit-val/components/RunnerInput'

import { calculateLineupRE, LineupCalculationResult } from '../features/lineup/api/re-line-up'
import { BatterStatsData } from '@sit-val/types/BatterStats'
import { RunnerStats } from '@sit-val/types/RunnerStats'
import LeadoffVisualizer from '../features/league/components/LeadoffVisualizer'
import Lineup9RE from '../features/lineup/components/Lineup9RE'
import LineupRE24 from '../features/lineup/components/LineupRE24'
import LineupBigInningVisualizer from '../features/lineup/components/LineupBigInningVisualizer'

interface Player extends BatterStatsData {
  id: number;
  name: string;
}

const LineupPage: React.FC = () => {
  const batterRef = useRef<BatterInputHandle>(null)
  const runnerRef = useRef<RunnerInputHandle>(null)

  // 상태 관리
  const [activeTools, setActiveTools] = useState<Array<{ id: number, Component: React.ComponentType<any> }>>([
    { id: 1, Component: (props: any) => <Lineup9RE {...props} /> },
    { id: 2, Component: (props: any) => <LineupRE24 {...props} /> },
  ])
  const [vizData, setVizData] = useState<[LineupCalculationResult] | null>(null)

  // 선수 및 타순 상태
  const [players, setPlayers] = useState<Player[]>([
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
  const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null);
  const [editingPlayerStats, setEditingPlayerStats] = useState<Player | null>(null);

  const addTool = (Component: React.FC<any>, extraProps = {}) => {
    setActiveTools(prev => [
      ...prev,
      { id: Date.now(), Component: (props) => <Component {...props} {...extraProps} /> }
    ]);
    setIsToolMenuOpen(false);
  }

  const execute = useCallback(() => {
    const lineupAbilities = lineup.map(id => {
      const p = players.find(player => player.id === id)!;
      // 하드코딩된 p.pa 대신 입력된 스탯 기반으로 정확한 PA 계산 (FO에 SF 포함 가정)
      const hits = (p['1B'] || 0) + (p['2B'] || 0) + (p['3B'] || 0) + (p.hr || 0);
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
  const startEditPlayer = (player: Player) => {
    setEditingPlayerId(player.id);
    setEditingPlayerStats(player); // Set the stats for the player being edited
    setBatterEditOpen(true);
  };

  // 타자 데이터 변경 저장
  const handleBatterDataChange = (updatedStats: BatterStatsData) => { // BatterInput에서 직접 updatedStats를 받음
    if (!editingPlayerId) return;
    // updatedStats는 이미 BatterInput에서 넘어온 최신 raw stats
    setPlayers(prev => prev.map(p => p.id === editingPlayerId ? { ...updatedStats, id: p.id, name: p.name } : p));
  };

  // 주자 데이터 변경 저장
  const handleRunnerDataChange = (updatedStats: RunnerStats) => {
    setLineupRunnerStats(updatedStats);
  };

  return (
    <>
      <Div id="wrapper">
        <Div style={{display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'center',  padding: '20px'}}>
          {activeTools.map(tool => (
            <VisualizerBox key={tool.id} onRemove={() => setActiveTools(prev => prev.filter(t => t.id !== tool.id))}>
              <tool.Component data={vizData} />
            </VisualizerBox>
          ))}
        </Div>

        {/* 도구 선택 팝업 */}
        <Div className={`bottom-sheet-overlay ${isToolMenuOpen ? 'active' : ''}`} onClick={() => setIsToolMenuOpen(false)} />

        <Popup
          isOpen={isToolMenuOpen}
          onClose={() => setIsToolMenuOpen(false)}
          title="분석 도구 추가"
        >
          <Div className="tool-grid">
            <Button onClick={() => addTool(LeadoffVisualizer)}>선두타자 분석</Button>
            <Button onClick={() => addTool(Lineup9RE)}>팀 기대 득점</Button>
            <Button onClick={() => addTool(LineupRE24)}>팀 RE24</Button>
            <Button onClick={() => addTool(LineupBigInningVisualizer)}>빅이닝 확률</Button>
          </Div>
        </Popup>

        {/* 선수 명단 바텀 시트 */}
        <BottomSheet
          isOpen={isPlayerListOpen}
          onClose={() => setPlayerListOpen(false)}
          title="선수 명단"
        >
          <Div style={{ flex: 1, overflowY: 'auto' }}>
            {players.map(p => (
              <Div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #eee' }}>
                <span>{p.name}</span>
                <Button style={{ padding: '5px 10px' }} onClick={() => startEditPlayer(p)}>편집</Button>
              </Div>
            ))}
          </Div>
          <Button style={{ width: '100%', marginTop: '15px' }} onClick={handleAddPlayer}>선수 추가</Button>
        </BottomSheet>

        {/* 타순 설정 바텀 시트 */}
        <BottomSheet
          isOpen={isLineupEditOpen}
          onClose={() => setLineupEditOpen(false)}
          title="타순 설정"
        >
          <Div style={{ flex: 1, overflowY: 'auto', paddingBottom: '20px' }}>
            {lineup.map((playerId, idx) => (
              <Div key={idx} style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
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
              </Div>
            ))}
          </Div>
          <Button style={{ width: '100%', marginTop: '10px' }} onClick={() => setLineupEditOpen(false)}>확인</Button>
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
            initialStats={editingPlayerStats || undefined} // Pass the stats to BatterInput
            onDataChange={handleBatterDataChange}
          />
        </BottomSheet>
      </Div>

      <FixedFooter>
        <Box className="container">
          <Div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Button onClick={() => setPlayerListOpen(true)}>선수 명단</Button>
            <Button onClick={() => setLineupEditOpen(true)}>타순 설정</Button>
            <Button onClick={() => setRunnerOpen(true)}>주자 설정</Button>
            <Button onClick={() => setIsToolMenuOpen(true)} style={{ marginLeft: 'auto' }}>도구 추가</Button>
          </Div>
        </Box>
      </FixedFooter>
    </>
  )
}

export default LineupPage