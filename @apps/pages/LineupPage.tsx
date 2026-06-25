import { Div } from '@shared/bridges/UIBridge';
import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import LeadoffVisualizer from '../features/lineup/components/LeadoffVisualizer';
import LineupBigInningVisualizer from '../features/lineup/components/LineupBigInningVisualizer';
import LineupRE24 from '../features/lineup/components/LineupRE24';
import LineupVisualizer from '../features/lineup/components/LineupVisualizer';
import { useLineupPageModel } from './hooks/useLineupPageModel';
import LineupEditPage from './lineup/LineupEditPage';
import LineupInfoPage from './lineup/LineupInfoPage';
import LineupSearchPage from './lineup/LineupSearchPage';
import { PageToolOption } from './types/pageTools';

const TOOL_OPTIONS: PageToolOption[] = [
	{ type: 'lineup-info', name: '라인업 정보', Component: LineupVisualizer },
	{ type: 'lineup-leadoff', name: '선두타자 분석', Component: LeadoffVisualizer },
	{ type: 'lineup-re24', name: '팀 RE24', Component: LineupRE24 },
	{ type: 'lineup-big-inning', name: '득점 확률', Component: LineupBigInningVisualizer },
];

const NewLineupPage: React.FC = () => {
	const { id } = useParams();
	const [searchParams] = useSearchParams();
	const model = useLineupPageModel(id, searchParams.get('from'), [
		{ type: 'lineup-info', name: '라인업 정보', Component: LineupVisualizer },
		{ type: 'lineup-re24', name: '팀 RE24', Component: LineupRE24 },
	]);

	if (!id) return <LineupSearchPage />;
	if (model.isLoading) return <Div style={{ padding: '40px' }}>불러오는 중...</Div>;

	return model.isEditMode ? (
		<LineupEditPage
			id={id === 'new' ? (searchParams.get('from') || 'new') : id!}
			lineupName={model.lineupName} setLineupName={model.setLineupName}
			selectedYear={model.selectedYear} setSelectedYear={model.setSelectedYear}
			availablePlayers={model.availablePlayers} setAvailablePlayers={model.setAvailablePlayers}
			currentLineupPlayers={model.currentLineupPlayers} setCurrentLineupPlayers={model.setCurrentLineupPlayers}
			lineupOrder={model.lineupOrder} setLineupOrder={model.setLineupOrder}
			lineupRunnerStats={model.lineupRunnerStats} setLineupRunnerStats={model.setLineupRunnerStats}
			activeTools={model.activeTools}
			setActiveTools={model.setActiveTools}
			vizData={model.vizData}
			isToolMenuOpen={model.isToolMenuOpen} setIsToolMenuOpen={model.setIsToolMenuOpen}
			addTool={model.addTool} toolOptions={TOOL_OPTIONS}
		/>
	) : (
		<LineupInfoPage
			id={id}
			lineupName={model.lineupName}
			selectedYear={model.selectedYear}
			activeTools={model.activeTools}
			setActiveTools={model.setActiveTools}
			vizData={model.vizData}
			isToolMenuOpen={model.isToolMenuOpen}
			setIsToolMenuOpen={model.setIsToolMenuOpen}
			addTool={model.addTool}
			toolOptions={TOOL_OPTIONS}
		/>
	);
};

export default NewLineupPage;
