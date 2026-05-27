import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Div, FixedFooter, Button, BottomSheet, vars, InputNumber, Select } from '@shared/bridges/UIBridge';
import { PageHeader } from '../../common/components/PageHeader';
import BatterInput from '@sit-val/components/BatterInput';
import { db } from '../../services/db';
import { YearlyPlayer } from '@packages/sit-val/types/Database';
import { BatterStatsData } from '@sit-val/types/BatterStats';
import { VisualizerList } from '../../common/components/VisualizerList';

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
  activeTools: Array<{ id: string, name: string, Component: React.ComponentType<any>, props?: any }>;
  onRemoveTool: (id: string) => void;
  vizData: any;
  isToolMenuOpen: boolean;
  setIsToolMenuOpen: (val: boolean) => void;
  addTool: (option: { name: string, Component: React.ComponentType<any>, props?: any }) => void;
  toolOptions: Array<{ name: string, Component: React.ComponentType<any>, props?: any }>;
}

const PlayerEditPage: React.FC<PlayerEditPageProps> = ({
  id, playerYearlyStats, playerName, setPlayerName, selectedYear, setSelectedYear, currentBatterStats, setCurrentBatterStats,
  yearlyLeagueId, setYearlyLeagueId, activeTools = [], onRemoveTool, vizData, isToolMenuOpen, setIsToolMenuOpen, 
  addTool, toolOptions
}) => {
  const navigate = useNavigate();
  const [isMetaOpen, setIsMetaOpen] = useState(false);
  const [isBatterInputOpen, setIsBatterInputOpen] = useState(false);
  const [leagueSearch, setLeagueSearch] = useState('');

  const handleSave = useCallback(() => {
    const playerIdToUse = playerYearlyStats?.playerId || `player-${Date.now()}`;
    const dataToSave = { 
      ...(playerYearlyStats || { playerId: playerIdToUse, yearlyTeamIds: [] }), 
      id: id !== 'new' ? id! : '', 
      year: selectedYear, 
      stats: { ...currentBatterStats, r: 0, rbi: 0 }, 
      name: playerName,
      yearlyLeagueId: yearlyLeagueId || undefined
    };
    try {
      const res = db.saveYearlyPlayer(dataToSave as any);
      navigate(`/player/${res.id}`);
    } catch (e: any) { alert(e.message); }
  }, [playerYearlyStats, currentBatterStats, selectedYear, playerName, yearlyLeagueId, id, navigate]);

  const isMetaValid = playerName.trim() !== '' && !isNaN(selectedYear) && selectedYear > 0;

  // 분석 도구들에 현재 편집 중인 실시간 스탯을 주입합니다.
  const toolsWithStats = useMemo(() => {
    return activeTools.map(tool => ({
      ...tool,
      props: { ...tool.props, batterStats: currentBatterStats }
    }));
  }, [activeTools, currentBatterStats]);

  return (
    <Div id="wrapper">
      <PageHeader title={`${playerName} (${selectedYear})`} subTitle={id} isEditMode={true} onEditToggle={() => navigate(-1)} onSave={handleSave} showSave={true} isSaveDisabled={!isMetaValid} />
      <VisualizerList 
        tools={toolsWithStats} 
        data={vizData} 
        onRemove={onRemoveTool || (() => {})} 
        toolOptions={toolOptions || []}
        onAddTool={addTool}
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
                ...db.getData('yearlyLeagues')
                  .filter((l: any) => 
                    l.leagueId.toLowerCase().includes(leagueSearch.toLowerCase()) || 
                    l.year.toString().includes(leagueSearch)
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
        <Button onClick={() => { handleSave(); setIsBatterInputOpen(false); }} style={{ width: '100%', marginTop: '10px', backgroundColor: '#4CAF50', color: 'white' }}>저장</Button>
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