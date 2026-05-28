import { Div } from '@shared/bridges/UIBridge';
import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import { RunnerStats } from '@sit-val/types/RunnerStats';
import { calculateLineupRE, LineupCalculationResult } from '../features/lineup/api/re-line-up';
import LeadoffVisualizer from '../features/lineup/components/LeadoffVisualizer';
// import Lineup9RE from '../features/lineup/components/Lineup9RE' // Removed as per request
import LineupBigInningVisualizer from '../features/lineup/components/LineupBigInningVisualizer';
import LineupRE24 from '../features/lineup/components/LineupRE24';

import { BatterStats } from '@packages/sit-val/types/BatterStats';
import { YearlyPlayer } from '@packages/sit-val/types/Database';
import { calculateBasicStats } from '../common/api/baseball';
import { calculateBatterAbility } from '../common/api/stats';
import LineupVisualizer from '../features/lineup/components/LineupVisualizer';
import { db } from '../services/db';
import { BasicStats } from '../types/BasicStats';
import LineupEditPage from './lineup/LineupEditPage';
import LineupInfoPage from './lineup/LineupInfoPage';
import LineupSearchPage from './lineup/LineupSearchPage';

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

	const [isLoading, setIsLoading] = useState(true);
	const [activeTools, setActiveTools] = useState<Array<{ id: string, name: string, Component: React.ComponentType<any>, props?: any }>>([
		{ id: '1', name: '라인업 정보', Component: LineupVisualizer },
		{ id: '2', name: '팀 RE24', Component: LineupRE24 }, // Keeping RE24 separate
	]);
	const [vizData, setVizData] = useState<[LineupCalculationResult, BasicStats] | null>(null);

	const [availablePlayers, setAvailablePlayers] = useState<LineupPlayerDisplay[]>(db.getSyncCache('allYearlyPlayersWithNames') || []);
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
			// 방어 코드: 선수를 찾지 못한 경우 null을 반환하고 이후 필터링
			const playerStatsList = lineupOrder
				.map(id => currentLineupPlayers.find(p => p.id === id)?.stats)
				.filter((s): s is YearlyPlayer['stats'] => s !== undefined);

			if (playerStatsList.length !== 9) {
				setVizData(null);
				return;
			}

			const abilities = playerStatsList.map(stats => calculateBatterAbility(new BatterStats(stats)));

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
			}), { '1B': 0, '2B': 0, '3B': 0, hr: 0, bb: 0, so: 0, go: 0, fo: 0, sf: 0, sh: 0, hbp: 0 });

			const basic = calculateBasicStats(new BatterStats(teamStats));
			setVizData([calculateLineupRE(abilities, lineupRunnerStats), basic]);
		} else setVizData(null);
	}, [currentLineupPlayers, lineupOrder, lineupRunnerStats]);

	useEffect(() => {
		const fetchData = async () => {
			const targetId = id === 'new' ? searchParams.get('from') : id;
			if (!id) return;

			// 1. 캐시 확인: 동기적으로 체크하여 데이터가 있으면 로딩 화면을 건너뜁니다.
			const cached = targetId ? db.getSyncCache(`yearlyLineup_${targetId}`) : null;
			if (cached) {
				setLineupOrder(cached.playerIds);
				setLineupRunnerStats(cached.runnerStats);
				setLineupName(cached.name);
				setSelectedYear(cached.year);
				setIsLoading(false);
			} else {
				setIsLoading(true);
			}

			// 2. 최신 데이터 조회
			const data = targetId ? await db.getYearlyLineupById(targetId) : null;
			if (data) { setLineupOrder(data.playerIds); setLineupRunnerStats(data.runnerStats); setLineupName(data.name); setSelectedYear(data.year); }
			setIsEditMode(id === 'new');

			// 임시 저장된 데이터 복구
			const pending = localStorage.getItem('pending_lineup_edit');
			if (pending) {
				const pData = JSON.parse(pending);
				setLineupOrder(pData.lineupOrder);
				setLineupRunnerStats(pData.lineupRunnerStats);
				setLineupName(pData.lineupName);
				setSelectedYear(pData.selectedYear);
				localStorage.removeItem('pending_lineup_edit');
			}
			setIsLoading(false);
		};
		fetchData();
	}, [id, searchParams]);

	useEffect(() => { execute(); }, [execute]);
	useEffect(() => {
		const fetchPlayers = async () => {
			const playersWithStats = await db.getPlayersWithYearlyStats(selectedYear);
			setAvailablePlayers(playersWithStats);
		};
		fetchPlayers();
	}, [selectedYear]);

	// 타순(lineupOrder)과 실제 선수 데이터(availablePlayers)를 기반으로 화면에 표시할 선수 목록을 동기화합니다.
	useEffect(() => {
		// isLoading이 true일 때는 아직 데이터 로딩 중이므로 currentLineupPlayers를 업데이트하지 않습니다.
		if (isLoading) return;

		const newLineupOrder = [...lineupOrder];
		const newCurrentLineupPlayers: LineupPlayerDisplay[] = [];

		for (let i = 0; i < 9; i++) {
			const yearlyPlayerId = newLineupOrder[i];
			let player = yearlyPlayerId ? availablePlayers.find(p => p.id === yearlyPlayerId) : undefined;

			if (!player) {
				// 해당 ID의 선수가 없거나 ID가 없는 경우 플레이스홀더 생성
				const placeholderId = `placeholder-${id}-${i + 1}`;
				player = {
					id: placeholderId,
					playerId: `temp-player-${i + 1}`,
					name: `선수 ${i + 1}`,
					year: selectedYear,
					yearlyTeamIds: [],
					stats: { '1B': 0, '2B': 0, '3B': 0, hr: 0, bb: 0, so: 0, go: 0, fo: 0, sf: 0, sh: 0, hbp: 0, r: 0, rbi: 0 },
					creatorId: 'unknown',
				};
				newLineupOrder[i] = placeholderId; // 타순 정보도 플레이스홀더 ID로 업데이트
			}
			newCurrentLineupPlayers.push(player!);
		}

		setCurrentLineupPlayers(newCurrentLineupPlayers);
		
		// 실제 값이 변경된 경우에만 lineupOrder를 업데이트하여 무한 루프 방지
		if (JSON.stringify(lineupOrder) !== JSON.stringify(newLineupOrder)) {
			setLineupOrder(newLineupOrder);
		}
	}, [availablePlayers, selectedYear, id, lineupOrder, isLoading]);

	useEffect(() => { if (isEditMode) setLineupRunnerStats(originalLineupRunnerStats); }, [isEditMode, originalLineupRunnerStats]);

	if (!id) return <LineupSearchPage />;
	if (isLoading) return <Div style={{ padding: '40px' }}>불러오는 중...</Div>;

	return isEditMode ? (
		<LineupEditPage
			id={id === 'new' ? (searchParams.get('from') || 'new') : id!}
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