import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router-dom';
import { Div } from '@shared/bridges/UIBridge';

import { calculateLineupRE, LineupCalculationResult } from '../features/lineup/api/re-line-up';
import { RunnerStats } from '@sit-val/types/RunnerStats'
import LeadoffVisualizer from '../features/lineup/components/LeadoffVisualizer'
// import Lineup9RE from '../features/lineup/components/Lineup9RE' // Removed as per request
import LineupRE24 from '../features/lineup/components/LineupRE24'
import LineupBigInningVisualizer from '../features/lineup/components/LineupBigInningVisualizer'

import { db } from '../services/db';
import { YearlyPlayer } from '@packages/sit-val/types/Database';
import { calculateBatterAbility } from '../common/api/stats';
import { calculateBasicStats } from '../common/api/baseball';
import { BasicStats } from '../types/BasicStats';
import LineupSearchPage from './lineup/LineupSearchPage';
import LineupInfoPage from './lineup/LineupInfoPage';
import LineupEditPage from './lineup/LineupEditPage';
import LineupVisualizer from '../features/lineup/components/LineupVisualizer';

export interface LineupPlayerDisplay extends YearlyPlayer {
	name: string;
}

const TOOL_OPTIONS = [
	{ name: '라인업 정보', Component: LineupVisualizer },
	{ name: '선두타자 분석', Component: LeadoffVisualizer },
	{ name: '팀 RE24', Component: LineupRE24 }, // Keeping RE24 separate
	{ name: '득점 확률', Component: LineupBigInningVisualizer },
];

const INITIAL_RUNNER_STATS: RunnerStats = {
	passedball: 0.03, s_r1_r2_safe: 0.10, s_r1_r2_out: 0.03,
	s_r2_r3_safe: 0.004, s_r2_r3_out: 0.001, '1B_r2_home_safe': 0.40,
	'1B_r2_home_out': 0.05, '1B_r2_r3_safe': 0.55, '1B_r1_r3_safe': 0.30,
	'1B_r1_r3_out': 0.05, '1B_r1_r2_safe': 0.65, '2B_r1_home_safe': 0.7,
	'2B_r1_home_out': 0.05, '2B_r1_r3_safe': 0.25, fo_r3_home_safe: 0.85,
	fo_r3_home_out: 0.05, fo_r3_r3_safe: 0.10, go_r1_r2_out: 0.3, go_b_r1_out: 0.3
};

const NewLineupPage: React.FC = () => {
	const { id } = useParams();
	const [searchParams] = useSearchParams();

	const [activeTools, setActiveTools] = useState<Array<{ id: string, name: string, Component: React.ComponentType<any>, props?: any }>>([
		{ id: '1', name: '라인업 정보', Component: LineupVisualizer },
		{ id: '2', name: '팀 RE24', Component: LineupRE24 }, // Keeping RE24 separate
	]);
	const [vizData, setVizData] = useState<[LineupCalculationResult, BasicStats] | null>(null);

	const [availablePlayers, setAvailablePlayers] = useState<LineupPlayerDisplay[]>([]);
	const [currentLineupPlayers, setCurrentLineupPlayers] = useState<LineupPlayerDisplay[]>([]);
	const [lineupOrder, setLineupOrder] = useState<string[]>([]);
	const [lineupName, setLineupName] = useState<string>('새 라인업');
	const [selectedYear, setSelectedYear] = useState<number>(2024);

	const [isEditMode, setIsEditMode] = useState(false);
	const [lineupRunnerStats, setLineupRunnerStats] = useState<RunnerStats>(INITIAL_RUNNER_STATS);
	const [originalLineupRunnerStats, setOriginalLineupRunnerStats] = useState<RunnerStats>(INITIAL_RUNNER_STATS);

	const [isToolMenuOpen, setIsToolMenuOpen] = useState(false);

	const addTool = (option: { name: string, Component: React.ComponentType<any>, props?: any }) => {
		setActiveTools(prev => [...prev, { id: Date.now().toString(), name: option.name, Component: option.Component, props: option.props }]);
		setIsToolMenuOpen(false);
	};

	const onRemoveTool = (id: string) => {
		setActiveTools(prev => prev.filter(t => t.id !== id));
	};

	const execute = useCallback(() => {
		if (lineupOrder.length === 9) {
			const playerStatsList = lineupOrder.map(id => currentLineupPlayers.find(p => p.id === id)!.stats);
			const abilities = playerStatsList.map(stats => calculateBatterAbility(stats));

			const teamStats = playerStatsList.reduce((acc, s) => ({
				'1B': acc['1B'] + (s['1B'] || 0),
				'2B': acc['2B'] + (s['2B'] || 0),
				'3B': acc['3B'] + (s['3B'] || 0),
				hr: acc.hr + (s.hr || 0),
				bb: acc.bb + (s.bb || 0),
				so: acc.so + (s.so || 0),
				go: acc.go + (s.go || 0),
				fo: acc.fo + (s.fo || 0),
				sf: acc.sf + (s.sf || 0),
				sh: acc.sh + (s.sh || 0),
				hbp: acc.hbp + (s.hbp || 0),
				pa: acc.pa + (s.pa || 0),
			}), { '1B': 0, '2B': 0, '3B': 0, hr: 0, bb: 0, so: 0, go: 0, fo: 0, sf: 0, sh: 0, hbp: 0, pa: 0 });

			const basic = calculateBasicStats(teamStats);
			setVizData([calculateLineupRE(abilities, lineupRunnerStats), basic]);
		} else setVizData(null);
	}, [currentLineupPlayers, lineupOrder, lineupRunnerStats]);

	useEffect(() => {
		const targetId = id === 'new' ? searchParams.get('from') : id;
		if (!id) return;
		const data = targetId ? db.getYearlyLineupById(targetId) : null;
		if (data) { setLineupOrder(data.playerIds); setLineupRunnerStats(data.runnerStats); setLineupName(data.name); setSelectedYear(data.year); }
		setIsEditMode(id === 'new');
	}, [id, searchParams]);

	useEffect(() => { execute(); }, [execute]);
	useEffect(() => {
		const playersWithStats = db.getPlayersWithYearlyStats(selectedYear);
		setAvailablePlayers(playersWithStats);
	}, [selectedYear]);

	useEffect(() => {
		const newCurrentLineupPlayers: LineupPlayerDisplay[] = [];
		const newLineupOrder: string[] = [];
		lineupOrder.forEach(yearlyPlayerId => {
			const player = availablePlayers.find(p => p.id === yearlyPlayerId);
			if (player) {
				newCurrentLineupPlayers.push(player);
				newLineupOrder.push(yearlyPlayerId);
			}
		});
		while (newLineupOrder.length < 9) {
			const placeholderId = `placeholder-${id}-${newLineupOrder.length + 1}`;
			const placeholderPlayer: LineupPlayerDisplay = {
				id: placeholderId, playerId: `temp-player-${newLineupOrder.length + 1}`, name: `선수 ${newLineupOrder.length + 1}`, year: selectedYear, yearlyTeamIds: [],
				stats: { '1B': 0, '2B': 0, '3B': 0, hr: 0, bb: 0, so: 0, go: 0, fo: 0, sf: 0, sh: 0, hbp: 0, pa: 0, r: 0, rbi: 0 },
				creatorId: db.getCurrentUser().id,
			};
			newCurrentLineupPlayers.push(placeholderPlayer);
			newLineupOrder.push(placeholderId);
		}
		setCurrentLineupPlayers(newCurrentLineupPlayers.slice(0, 9));
		setLineupOrder(newLineupOrder.slice(0, 9));
	}, [availablePlayers, selectedYear, id]);

	useEffect(() => { if (isEditMode) setLineupRunnerStats(originalLineupRunnerStats); }, [isEditMode, originalLineupRunnerStats]);

	if (!id) return <LineupSearchPage />;
	if (id !== 'new' && !db.getYearlyLineupById(id)) return <Div style={{ padding: '40px' }}>404 - 라인업 없음</Div>;

	return isEditMode ? (
		<LineupEditPage
			id={id}
			lineupName={lineupName} setLineupName={setLineupName}
			selectedYear={selectedYear} setSelectedYear={setSelectedYear}
			availablePlayers={availablePlayers} setAvailablePlayers={setAvailablePlayers}
			currentLineupPlayers={currentLineupPlayers} setCurrentLineupPlayers={setCurrentLineupPlayers}
			lineupOrder={lineupOrder} setLineupOrder={setLineupOrder}
			lineupRunnerStats={lineupRunnerStats} setLineupRunnerStats={setLineupRunnerStats}
			activeTools={activeTools}
			onRemoveTool={onRemoveTool}
			vizData={vizData}
			isToolMenuOpen={isToolMenuOpen} setIsToolMenuOpen={setIsToolMenuOpen}
			addTool={addTool} toolOptions={TOOL_OPTIONS}
		/>
	) : (
		<LineupInfoPage
			id={id}
			lineupName={lineupName}
			selectedYear={selectedYear}
			activeTools={activeTools}
			vizData={vizData}
			isToolMenuOpen={isToolMenuOpen}
			setIsToolMenuOpen={setIsToolMenuOpen}
			addTool={addTool}
			toolOptions={TOOL_OPTIONS}
			onRemoveTool={onRemoveTool}
		/>
	);
};

export default NewLineupPage;