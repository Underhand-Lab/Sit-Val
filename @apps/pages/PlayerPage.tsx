import { Div } from '@shared/bridges/UIBridge';
import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import PlayerBasicVisualizer from '../features/player/components/PlayerBasicVisualizer';
import PlayerPersonalVisualizer from '../features/player/components/PlayerPersonalVisualizer';
import { usePlayerPageModel } from './hooks/usePlayerPageModel';
import PlayerInfoPage from './player/PlayerInfoPage';
import PlayerSearchPage from './player/PlayerSearchPage';
import { PageToolOption } from './types/pageTools';

const TOOL_OPTIONS: PageToolOption[] = [
  { type: 'player-basic', name: '기본 타격 지표', Component: PlayerBasicVisualizer },
  { type: 'player-personal', name: '개인 확장 가치', Component: PlayerPersonalVisualizer },
];

const PlayerPage: React.FC = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const model = usePlayerPageModel(id, searchParams.get('from'), TOOL_OPTIONS);

  if (!id) return <PlayerSearchPage />;
  if (model.isLoading) return <Div style={{ padding: '40px' }}>불러오는 중...</Div>;
  if (id !== 'new' && !model.playerYearlyStats) return <Div style={{ padding: '40px' }}>404 - 선수를 찾을 수 없습니다.</Div>;

  return (
    <PlayerInfoPage 
      id={id}
      playerName={model.playerName}
      setPlayerName={model.setPlayerName}
      playerInfo={model.playerYearlyStats}
      selectedYear={model.selectedYear}
      setSelectedYear={model.setSelectedYear}
      leagueData={model.leagueData}
      currentBatterStats={model.currentBatterStats}
      setCurrentBatterStats={model.setCurrentBatterStats}
      yearlyLeagueId={model.yearlyLeagueId}
      setYearlyLeagueId={model.setYearlyLeagueId}
      activeTools={model.activeTools}
      setActiveTools={model.setActiveTools}
      vizData={model.vizData}
      isToolMenuOpen={model.isToolMenuOpen}
      setIsToolMenuOpen={model.setIsToolMenuOpen}
      addTool={model.addTool}
      toolOptions={TOOL_OPTIONS}
      handleSave={model.handleSave}
      isMetaValid={model.isMetaValid}
      startInEditMode={model.isEditMode}
    />
  );
};

export default PlayerPage;
