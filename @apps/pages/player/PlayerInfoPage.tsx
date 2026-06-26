import { YearlyLeague, YearlyPlayer } from '@packages/sit-val/types/Database';
import { Button, Div, InputNumber, SearchableSelect } from '@shared/bridges/UIBridge';
import BatterInput from '@sit-val/components/BatterInput';
import { BatterStats } from '@sit-val/types/BatterStats';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../common/components/PageHeader';
import { db } from '../../services/db';
import { VisualizerList } from '../../features/visualizer/components/VisualizerList';
import { INITIAL_BATTER_STATS } from '../hooks/usePlayerPageModel';

interface PlayerInfoPageProps {
  id: string;
  playerName: string;
  playerInfo: YearlyPlayer | null;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  setPlayerName: (name: string) => void;
  leagueData: YearlyLeague | null;
  currentBatterStats: any;
  setCurrentBatterStats: (stats: any) => void;
  yearlyLeagueId: string;
  setYearlyLeagueId: (id: string) => void;
  activeTools: Array<{ type: string; name: string; Component: React.ComponentType<any>; props?: any }>;
  setActiveTools: (tools: any) => void;
  vizData: any;
  isToolMenuOpen: boolean;
  setIsToolMenuOpen: (val: boolean) => void;
  addTool: (option: { type: string, name: string, Component: React.ComponentType<any>, props?: any }) => void;
  toolOptions: Array<{ type: string, name: string, Component: React.ComponentType<any>, props?: any }>;
  handleSave: () => Promise<string | undefined | null>;
  isMetaValid: boolean;
  startInEditMode?: boolean;
}

const PlayerInfoPage: React.FC<PlayerInfoPageProps> = ({
  id, playerName, playerInfo, selectedYear, setSelectedYear, setPlayerName, leagueData,
  currentBatterStats, setCurrentBatterStats, yearlyLeagueId, setYearlyLeagueId,
  activeTools = [], setActiveTools, vizData, isToolMenuOpen, setIsToolMenuOpen, addTool, toolOptions,
  handleSave, isMetaValid, startInEditMode = false,
}) => {
  const navigate = useNavigate();
  const [yearlyLeagues, setYearlyLeagues] = useState<YearlyLeague[]>([]);

  const handleEditorSave = useCallback(async () => {
    try {
      const savedId = await handleSave();
      if (savedId) {
        navigate(`/player/${savedId}`);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : '저장에 실패했습니다.');
    }
  }, [handleSave, navigate]);

  useEffect(() => {
    db.getAllYearlyLeagues().then(setYearlyLeagues);
  }, []);

  const commonItemProps = useMemo(() => ({
    batterStats: new BatterStats(currentBatterStats || playerInfo?.stats || INITIAL_BATTER_STATS)
  }), [currentBatterStats, playerInfo]);

  const leagueOptions = useMemo(() => [
    { label: '선택 안함', value: '' },
    ...yearlyLeagues.map((league: any) => ({
      label: `${league.year} ${league.leagueId}`,
      value: league.id,
    }))
  ], [yearlyLeagues]);

  const editorToolOptions = useMemo(() => {
    const PlayerMetaEditor: React.FC = () => (
      <Div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <Div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '220px' }}>
            <label style={{ minWidth: '72px' }}>선수 이름</label>
            <InputNumber type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)} />
          </Div>
          <Div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '220px' }}>
            <label style={{ minWidth: '72px' }}>분석 연도</label>
            <InputNumber value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} />
          </Div>
        </Div>
        <Div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label>연동 리그 설정</label>
          <SearchableSelect
            value={yearlyLeagueId || ''}
            onChange={setYearlyLeagueId}
            sections={[{ label: '리그 목록', options: leagueOptions }]}
            searchOptions={leagueOptions}
            searchResultsLabel="검색 결과"
            placeholder="리그 검색 (연도 또는 이름)..."
            allowCustomValue={false}
          />
        </Div>
        <Div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={handleEditorSave} disabled={!isMetaValid}>저장</Button>
        </Div>
      </Div>
    );

    const PlayerBatterEditor: React.FC = () => (
      <Div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <BatterInput initialStats={currentBatterStats} onDataChange={setCurrentBatterStats} />
        <Div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={handleEditorSave} disabled={!isMetaValid}>저장</Button>
        </Div>
      </Div>
    );

    return [
      { type: 'player-meta-editor', name: '기본 정보 편집', Component: PlayerMetaEditor },
      { type: 'player-batter-editor', name: '타격 능력 편집', Component: PlayerBatterEditor },
    ];
  }, [currentBatterStats, handleEditorSave, isMetaValid, leagueOptions, playerName, selectedYear, setCurrentBatterStats, setPlayerName, setSelectedYear, setYearlyLeagueId, yearlyLeagueId]);

  const allToolOptions = useMemo(
    () => [...toolOptions, ...editorToolOptions],
    [editorToolOptions, toolOptions]
  );

  useEffect(() => {
    if (!startInEditMode) return;
    if (activeTools.some((tool) => tool.type === 'player-meta-editor' || tool.type === 'player-batter-editor')) return;
    setActiveTools([...activeTools, ...editorToolOptions]);
  }, [activeTools, editorToolOptions, setActiveTools, startInEditMode]);

  useEffect(() => {
    setActiveTools((prev: any[]) =>
      prev.map((tool) => {
        const latestOption = editorToolOptions.find((option) => option.type === tool.type);
        return latestOption ? { ...tool, ...latestOption } : tool;
      })
    );
  }, [editorToolOptions, setActiveTools]);

  const mergedVizData = useMemo(() => {
    if (!vizData) return vizData;
    const statsInstance = new BatterStats(currentBatterStats || INITIAL_BATTER_STATS);
    const newData = [...vizData];
    if (newData[5]) {
      const h = statsInstance['1B'] + statsInstance['2B'] + statsInstance['3B'] + statsInstance.hr;
      const ab = statsInstance.pa - statsInstance.bb - statsInstance.hbp - statsInstance.sh - (currentBatterStats.sf || 0);
      newData[5] = {
        ...newData[5],
        ...currentBatterStats,
        pa: statsInstance.pa,
        ab,
        h,
        avg: h / (ab || 1),
        obp: (h + statsInstance.bb + statsInstance.hbp) / (statsInstance.pa - statsInstance.sh || 1),
        slg: (statsInstance['1B'] + statsInstance['2B'] * 2 + statsInstance['3B'] * 3 + statsInstance.hr * 4) / (ab || 1)
      };
    }
    return newData;
  }, [currentBatterStats, vizData]);

  return (
    <Div id="wrapper">
      <PageHeader 
        title={`${playerName || playerInfo?.name || ''} (${selectedYear})`} 
        subTitle={id} 
      />
      <VisualizerList 
        tools={activeTools} 
        data={mergedVizData} 
        commonItemProps={commonItemProps}
        onToolsSync={setActiveTools}
        toolOptions={allToolOptions}
        onAddTool={addTool}
        isToolMenuOpen={isToolMenuOpen}
        setIsToolMenuOpen={setIsToolMenuOpen}
        storageKey="player-visualizer-layout"
      />
    </Div>
  );
};
export default PlayerInfoPage;
