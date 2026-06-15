import { YearlyLeague, YearlyPlayer } from '@packages/sit-val/types/Database';
import { BottomSheet, Button, Div, FixedFooter, InputNumber, Select, vars } from '@shared/bridges/UIBridge';
import BatterInput from '@sit-val/components/BatterInput';
import { BatterStats, BatterStatsData } from '@sit-val/types/BatterStats';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom'
;
import { PageHeader } from '../../common/components/PageHeader';
import { VisualizerList } from '../../common/components/VisualizerList';
import { db } from '../../services/db';
import { INITIAL_BATTER_STATS } from '../PlayerPage';

interface PlayerEditPageProps {
  id: string;
  playerYearlyStats: YearlyPlayer | null;
  playerName: string;
  setPlayerName: (name: string) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  currentBatterStats: BatterStatsData;
  setCurrentBatterStats: (stats: BatterStatsData) => void;
  yearlyLeagueId: string;
  setYearlyLeagueId: (id: string) => void;
  activeTools: Array<{ type: string, name: string, Component: React.ComponentType<any>, props?: any }>;
  setActiveTools: (tools: any) => void;
  vizData: any;
  isToolMenuOpen: boolean;
  setIsToolMenuOpen: (val: boolean) => void;
  addTool: (option: { type: string, name: string, Component: React.ComponentType<any>, props?: any }) => void;
  toolOptions: Array<{ type: string, name: string, Component: React.ComponentType<any>, props?: any }>;
}

const PlayerEditPage: React.FC<PlayerEditPageProps> = ({
  id, playerYearlyStats, playerName, setPlayerName, selectedYear, setSelectedYear, currentBatterStats, setCurrentBatterStats,
  yearlyLeagueId, setYearlyLeagueId, activeTools = [], setActiveTools, vizData, isToolMenuOpen, setIsToolMenuOpen, 
  addTool, toolOptions
}) => {
  const navigate = useNavigate();
  const [isMetaOpen, setIsMetaOpen] = useState(false);
  const [isBatterInputOpen, setIsBatterInputOpen] = useState(false);
  const [leagueSearch, setLeagueSearch] = useState('');
  const [yearlyLeagues, setYearlyLeagues] = useState<YearlyLeague[]>([]);

  useEffect(() => {
    db.getAllYearlyLeagues().then(setYearlyLeagues);
  }, []);

  const handleSave = useCallback(async () => {
    const user = await db.getCurrentUser();
    if (!user) {
      if (confirm('로그인이 필요한 기능입니다. 현재 내용을 임시 저장하고 로그인 페이지로 이동하시겠습니까?')) {
        const pendingData = { playerName, selectedYear, currentBatterStats, yearlyLeagueId, playerYearlyStats };
        localStorage.setItem('pending_player_edit', JSON.stringify(pendingData));
        navigate('/login');
      }
      return;
    }
    const playerIdToUse = playerYearlyStats?.playerId || `player-${Date.now()}`;
    const statsInstance = new BatterStats(currentBatterStats || INITIAL_BATTER_STATS);
    const dataToSave = { 
      id: playerYearlyStats?.id || '',
      playerId: playerIdToUse,
      year: selectedYear,
      stats: { ...(currentBatterStats || INITIAL_BATTER_STATS), pa: statsInstance.pa, r: 0, rbi: 0 } as any,
      name: playerName || '',
      yearlyLeagueId: yearlyLeagueId || null,
      yearlyTeamIds: playerYearlyStats?.yearlyTeamIds || ([] as string[])
    };
    try {
      const res = await db.saveYearlyPlayer(dataToSave);
      navigate(`/player/${res.id}`);
    } catch (e: any) { alert(e.message); }
  }, [playerYearlyStats, currentBatterStats, selectedYear, playerName, yearlyLeagueId, id, navigate]);

  const isMetaValid = (playerName || '').trim() !== '' && !isNaN(selectedYear) && selectedYear > 0;

  // 시각화 도구들에 전달할 데이터를 현재 편집 중인 스탯으로 보정합니다.
  // LeagueEditPage는 부모가 vizData를 갱신해주지만, PlayerEditPage는 리그 컨텍스트가 고정되어 있으므로
  // 개별 선수의 스탯(타석 등)이 실시간으로 도구들에 반영되려면 데이터를 여기서 병합해줘야 합니다.
  const mergedVizData = useMemo(() => {
    if (!vizData) return vizData;
    const statsInstance = new BatterStats(currentBatterStats || INITIAL_BATTER_STATS);
    const newData = [...vizData];
    // vizData[5]가 BasicStats(기본 통계) 자리이므로 이를 현재 편집 중인 값으로 교체합니다.
    if (newData[5]) {
      const h = statsInstance['1B'] + statsInstance['2B'] + statsInstance['3B'] + statsInstance.hr;
      // sf가 fo에 포함되어 있으므로, 타석(pa)에서 제외된 상태여도 타수(ab)를 구할 때는 sac_fly만큼 더 빼줘야 합니다.
      const ab = statsInstance.pa - statsInstance.bb - statsInstance.hbp - statsInstance.sh - (currentBatterStats.sf || 0);
      newData[5] = {
        ...newData[5],
        ...currentBatterStats,
        pa: statsInstance.pa,
        ab: ab,
        h: h,
        avg: h / (ab || 1),
        obp: (h + statsInstance.bb + statsInstance.hbp) / (statsInstance.pa - statsInstance.sh || 1),
        slg: (statsInstance['1B'] + statsInstance['2B'] * 2 + statsInstance['3B'] * 3 + statsInstance.hr * 4) / (ab || 1)
      };
    }
    return newData;
  }, [vizData, currentBatterStats]);

  // 실시간으로 변하는 공통 Props만 별도로 메모이제이션합니다.
  const commonItemProps = useMemo(() => ({
    batterStats: new BatterStats(currentBatterStats || INITIAL_BATTER_STATS)
  }), [currentBatterStats]);

  return (
    <Div id="wrapper">
      <PageHeader title={`${playerName} (${selectedYear})`} subTitle={id} isEditMode={true} onEditToggle={() => navigate(-1)} onSave={handleSave} showSave={true} isSaveDisabled={!isMetaValid} />
      <VisualizerList 
        tools={activeTools} 
        data={mergedVizData} 
        commonItemProps={commonItemProps}
        onToolsSync={setActiveTools}
        toolOptions={toolOptions || []}
        onAddTool={addTool}
        isToolMenuOpen={isToolMenuOpen}
        setIsToolMenuOpen={setIsToolMenuOpen}
        storageKey="player-visualizer-layout"
      />

      <BottomSheet isOpen={isMetaOpen} onClose={() => setIsMetaOpen(false)} title={`${playerName} 정보 설정`}>
        <Div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <Div style={{display: "flex", flexDirection: 'row', gap: "10px", alignItems: 'center'}}>
            <label style={{ display: 'block', marginBottom: '5px' }}>선수 이름</label>
            <InputNumber type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)} />
          </Div>
          <Div style={{display: "flex", flexDirection: 'row', gap: "10px", alignItems: 'center'}}>
            <label style={{ display: 'block', marginBottom: '5px' }}>분석 연도</label>
            <InputNumber value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}/>
          </Div>
        </Div>
        <Div>
          <Div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>연동 리그 설정</label>
            <InputNumber
              type="text" 
              placeholder="리그 검색 (연도 또는 이름)..." 
              value={leagueSearch} 
              onChange={(e) => setLeagueSearch(e.target.value)}
            />
            <Select 
              value={yearlyLeagueId || ''} 
              onChange={(e) => setYearlyLeagueId(e.target.value)}
              style={{ width: '100%' }}
              options={[
                { label: '선택 안함', value: '' },
                ...yearlyLeagues
                  .filter((l: any) => 
                    (l.leagueId || '').toLowerCase().includes(leagueSearch.toLowerCase()) || 
                    (l.year || '').toString().includes(leagueSearch)
                  )
                  .map((league: any) => ({ label: `${league.year} ${league.leagueId}`, value: league.id }))
              ]}
            />
          </Div>
          <Button onClick={() => setIsMetaOpen(false)} disabled={!isMetaValid} style={{ marginTop: '15px', width: '100%', backgroundColor: isMetaValid ? undefined : '#ccc' }}>확인</Button>
        </Div>
      </BottomSheet>
      <BottomSheet isOpen={isBatterInputOpen} onClose={() => setIsBatterInputOpen(false)} title="선수 스탯">
        <BatterInput initialStats={currentBatterStats} onDataChange={setCurrentBatterStats} />
        <Button onClick={() => setIsBatterInputOpen(false)} style={{ width: '100%', marginTop: '10px' }}>확인</Button>
      </BottomSheet>

      <FixedFooter style={{ backgroundColor: vars.box, borderTop: `1px solid ${vars.surface}` }}>
        <Div style={{ display: 'flex', gap: '10px', padding: '15px', justifyContent: 'center' }}>
          <Button onClick={() => setIsMetaOpen(true)}>정보 설정</Button>
          <Button onClick={() => setIsBatterInputOpen(true)}>스탯 상세</Button>
        </Div>
      </FixedFooter>
    </Div>
  );
};
export default PlayerEditPage;