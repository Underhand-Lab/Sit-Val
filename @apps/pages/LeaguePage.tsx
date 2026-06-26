import { Div } from '@shared/bridges/UIBridge';
import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import LeagueVisualizer from '../features/league/components/LeagueVisualizer';
import PersonalVisualizer from '../features/league/components/PersonalVisualizer';
import RunValueVisualizer from '../features/league/components/RunValueVisualizer';

import LeagueBigInningVisualizer from '@apps/features/league/components/LeagueBigInningVisualizer';
import RE24Visualizer from '@apps/features/league/components/RE24Visualizer';
import { useLeaguePageModel } from './hooks/useLeaguePageModel';
import LeagueInfoPage from './league/LeagueInfoPage';
import LeagueSearchPage from './league/LeagueSearchPage';
import { PageToolOption } from './types/pageTools';

const TOOL_OPTIONS: PageToolOption[] = [
	{ type: 'league-info', name: '리그 정보', Component: LeagueVisualizer },
	{ type: 'league-re24', name: 'RE24', Component: RE24Visualizer },
	{ type: 'league-big-inning', name: '득점 확률', Component: LeagueBigInningVisualizer },
	{ type: 'league-run-value', name: '타구 가치', Component: RunValueVisualizer },
	{ type: 'league-personal', name: '개인 가치', Component: PersonalVisualizer },
];

function LeaguePage() {
	const { id } = useParams();
	const [searchParams] = useSearchParams();
	const model = useLeaguePageModel(id, searchParams.get('from'), [
		{ type: 'league-info', name: '리그 정보', Component: LeagueVisualizer },
		{ type: 'league-run-value', name: '타구 가치', Component: RunValueVisualizer },
		{ type: 'league-personal', name: '개인 가치', Component: PersonalVisualizer }
	]);

	if (!id) return <LeagueSearchPage />;
	if (model.isLoading) return <Div style={{ padding: '40px' }}>데이터를 불러오는 중...</Div>;
	if (id !== 'new' && !model.yearlyLeagueData) return <Div style={{ padding: '40px' }}>404 - 리그를 찾을 수 없습니다.</Div>;

	return (
		<LeagueInfoPage
			id={id}
			leagueIdInput={model.leagueIdInput}
			setLeagueIdInput={model.setLeagueIdInput}
			selectedYear={model.selectedYear}
			setSelectedYear={model.setSelectedYear}
			leagueBatterStats={model.leagueBatterStats}
			setLeagueBatterStats={model.setLeagueBatterStats}
			leagueRunnerStats={model.leagueRunnerStats}
			setLeagueRunnerStats={model.setLeagueRunnerStats}
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
}

export default LeaguePage
