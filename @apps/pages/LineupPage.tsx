import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Popup from '@shared/components/Modal';
import { Box, Div, H3, Button, FixedFooter, BottomSheet } from '@shared/bridges/UIBridge';

import BatterInput, { BatterInputHandle } from '@sit-val/components/BatterInput'
import RunnerInput, { RunnerInputHandle } from '@sit-val/components/RunnerInput'

import { calculateLineupRE, LineupCalculationResult } from '../features/lineup/api/re-line-up'
import { BatterStatsData } from '@sit-val/types/BatterStats'
import { RunnerStats } from '@sit-val/types/RunnerStats'
import LeadoffVisualizer from '../features/league/components/LeadoffVisualizer'
import Lineup9RE from '../features/lineup/components/Lineup9RE'
import LineupRE24 from '../features/lineup/components/LineupRE24'
import LineupBigInningVisualizer from '../features/lineup/components/LineupBigInningVisualizer'

import { db } from '../services/db';
import { Player, YearlyPlayer, YearlyLeague } from '@packages/sit-val/types/Database';
import { calculateBatterAbility } from '../common/api/stats';
import { PageHeader } from '../common/components/PageHeader';
import { VisualizerList } from '../common/components/VisualizerList';
import { DataManagementView } from '../common/components/DataManagementView';

interface LineupPlayerDisplay extends YearlyPlayer {
	name: string;
}

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
	const navigate = useNavigate();
	const batterRef = useRef<BatterInputHandle>(null);
	const runnerRef = useRef<RunnerInputHandle>(null);

	const [activeTools, setActiveTools] = useState<Array<{ id: number, Component: React.ComponentType<any> }>>([
		{ id: 1, Component: Lineup9RE }, { id: 2, Component: LineupRE24 },
	]);
	const [vizData, setVizData] = useState<[LineupCalculationResult] | null>(null);

	const [availablePlayers, setAvailablePlayers] = useState<LineupPlayerDisplay[]>([]);
	const [currentLineupPlayers, setCurrentLineupPlayers] = useState<LineupPlayerDisplay[]>([]);
	const [lineupOrder, setLineupOrder] = useState<string[]>([]);
	const [selectedYear, setSelectedYear] = useState<number>(2024);
	const [leagueData, setLeagueData] = useState<YearlyLeague | null>(null);

	const [isEditMode, setIsEditMode] = useState(false);
	const [lineupRunnerStats, setLineupRunnerStats] = useState<RunnerStats>(INITIAL_RUNNER_STATS);
	const [originalLineupRunnerStats, setOriginalLineupRunnerStats] = useState<RunnerStats>(INITIAL_RUNNER_STATS);

	const [isPlayerListOpen, setPlayerListOpen] = useState(false);
	const [isLineupEditOpen, setLineupEditOpen] = useState(false);
	const [isRunnerOpen, setRunnerOpen] = useState(false);
	const [isBatterEditOpen, setBatterEditOpen] = useState(false);
	const [isToolMenuOpen, setIsToolMenuOpen] = useState(false);
	const [editingYearlyPlayerId, setEditingYearlyPlayerId] = useState<string | null>(null);
	const [editingPlayerStats, setEditingPlayerStats] = useState<BatterStatsData | null>(null);

	const addTool = (Component: React.FC<any>) => {
		setActiveTools(prev => [...prev, { id: Date.now(), Component }]);
		setIsToolMenuOpen(false);
	};

	const execute = useCallback(() => {
		if (lineupOrder.length === 9) {
			const abilities = lineupOrder.map(id => calculateBatterAbility(currentLineupPlayers.find(p => p.id === id)!.stats));
			setVizData([calculateLineupRE(abilities, lineupRunnerStats)]);
		} else setVizData(null);
	}, [currentLineupPlayers, lineupOrder, lineupRunnerStats]);

	useEffect(() => {
		const targetId = id === 'new' ? searchParams.get('from') : id;
		if (!id) return;
		const data = targetId ? db.getYearlyLineupById(targetId) : null;
		if (data) { setLineupOrder(data.playerIds); setLineupRunnerStats(data.runnerStats); }
		setIsEditMode(id === 'new');
	}, [id, searchParams]);

	useEffect(() => { execute(); }, [execute]);
	useEffect(() => {
		const fetchPlayersAndLeague = async () => {
			const playersWithStats = db.getPlayersWithYearlyStats(selectedYear);
			setAvailablePlayers(playersWithStats);
			const fetchedLeagueData = db.getYearlyLeagues('kbo').find(l => l.year === selectedYear);
			if (fetchedLeagueData) setLeagueData(fetchedLeagueData);
			else setLeagueData(null);
		};
		fetchPlayersAndLeague();
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
			const placeholderId = `placeholder-${newLineupOrder.length + 1}`;
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
	}, [availablePlayers, selectedYear]);

	useEffect(() => { if (isEditMode) setLineupRunnerStats(originalLineupRunnerStats); }, [isEditMode, originalLineupRunnerStats]);

	const handleAddNewPlayerToDB = () => {
		const newPlayerId = `new-player-${Date.now()}`;
		const newPlayerBase: Player = { id: newPlayerId, name: `새 선수 ${Date.now()}` };
		db.addPlayer(newPlayerBase);
		const newYearlyPlayer: YearlyPlayer & { name: string } = {
			id: `${newPlayerId}-${selectedYear}-${Date.now()}`, playerId: newPlayerId, name: newPlayerBase.name, year: selectedYear, yearlyTeamIds: [],
			stats: { '1B': 0, '2B': 0, '3B': 0, hr: 0, bb: 0, so: 0, go: 0, fo: 0, sf: 0, sh: 0, hbp: 0, pa: 0, r: 0, rbi: 0 },
			creatorId: db.getCurrentUser().id,
		};
		db.saveYearlyPlayer(newYearlyPlayer);
		setAvailablePlayers(prev => [...prev, newYearlyPlayer as LineupPlayerDisplay]);
		startEditPlayer(newYearlyPlayer.id, newYearlyPlayer.stats);
	};

	const startEditPlayer = (yearlyPlayerId: string, stats: BatterStatsData) => {
		setEditingYearlyPlayerId(yearlyPlayerId); setEditingPlayerStats(stats); setBatterEditOpen(true);
	};

	const handleBatterDataChange = (newStats: BatterStatsData) => {
		if (!editingYearlyPlayerId) return; setEditingPlayerStats(newStats);
	};

	const handleSaveEditedPlayerStats = useCallback(() => {
		if (!editingYearlyPlayerId || !editingPlayerStats) return alert('저장할 데이터가 없습니다.');
		const originalYearlyPlayer = availablePlayers.find(p => p.id === editingYearlyPlayerId);
		if (!originalYearlyPlayer) return alert('원본 선수를 찾을 수 없습니다.');
		const dataToSave: Omit<YearlyPlayer, 'creatorId'> = { ...originalYearlyPlayer, stats: { ...editingPlayerStats, r: 0, rbi: 0 } };
		try {
			db.saveYearlyPlayer(dataToSave);
			setAvailablePlayers(db.getPlayersWithYearlyStats(selectedYear));
			setBatterEditOpen(false);
		} catch (e: any) { alert(e.message); }
	}, [editingYearlyPlayerId, editingPlayerStats, availablePlayers, selectedYear, db]);

	const handleRunnerDataChange = (updatedStats: RunnerStats) => { setLineupRunnerStats(updatedStats); };

	const handleSaveLineupStats = useCallback(() => {
		const name = prompt('라인업 이름') || '새 라인업';
		const res = db.saveYearlyLineup({ id: id !== 'new' ? id! : '', name, year: selectedYear, playerIds: lineupOrder, runnerStats: lineupRunnerStats });
		navigate(`/lineup/${res.id}`); setIsEditMode(false);
	}, [lineupRunnerStats, lineupOrder, selectedYear, id, navigate]);

	if (!id) return <DataManagementView title="라인업" items={db.getData('yearlyLineups')} createPath="/lineup/new" renderItem={(l) => <Button onClick={() => navigate(`/lineup/${l.id}`)}>{l.name} ({l.year})</Button>} />;
	if (id !== 'new' && !db.getYearlyLineupById(id)) return <Div style={{ padding: '40px' }}>404 - 라인업 없음</Div>;

	return (
		<Div id="wrapper">
			<PageHeader title="라인업 분석" subTitle={id} isEditMode={isEditMode} onEditToggle={() => isEditMode ? navigate('/lineup') : navigate(`/lineup/new?from=${id}`)} onSave={handleSaveLineupStats} showSave={true} />
			<VisualizerList tools={activeTools} data={vizData} onRemove={(id) => setActiveTools(prev => prev.filter(t => t.id !== id))} />
			<Popup isOpen={isToolMenuOpen} onClose={() => setIsToolMenuOpen(false)} title="분석 도구 추가">
				<Div className="tool-grid">
					<Button onClick={() => addTool(LeadoffVisualizer)}>선두타자 분석</Button>
					<Button onClick={() => addTool(Lineup9RE)}>팀 기대 득점</Button>
					<Button onClick={() => addTool(LineupRE24)}>팀 RE24</Button>
					<Button onClick={() => addTool(LineupBigInningVisualizer)}>빅이닝 확률</Button>
				</Div>
			</Popup>

			<BottomSheet isOpen={isPlayerListOpen} onClose={() => setPlayerListOpen(false)} title="선수 명단">
				<Div style={{ flex: 1, overflowY: 'auto' }}>
					{availablePlayers.length === 0 && <p>등록된 선수가 없습니다. 새 선수를 추가해주세요.</p>}
					{availablePlayers.map(p => (
						<Div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #eee', gap: '10px' }}>
							<span>{p.name}</span>
							<Div style={{ display: 'flex', gap: '5px' }}>
								<Button style={{ padding: '5px 10px' }} onClick={() => startEditPlayer(p.id, p.stats)}>편집</Button>
								<Button style={{ padding: '5px 10px', backgroundColor: '#007bff', color: 'white' }} onClick={() => { if (currentLineupPlayers.length < 9) { setCurrentLineupPlayers(prev => [...prev, p]); setLineupOrder(prev => [...prev, p.id]); } }}>라인업 추가</Button>
							</Div>
						</Div>
					))}
				</Div>
				<Button style={{ width: '100%', marginTop: '15px' }} onClick={handleAddNewPlayerToDB}>새 선수 추가</Button>
			</BottomSheet>

			<BottomSheet isOpen={isLineupEditOpen} onClose={() => setLineupEditOpen(false)} title="타순 설정">
				<Div style={{ flex: 1, overflowY: 'auto', paddingBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
					{lineupOrder.map((yearlyPlayerId, idx) => {
						const playerInLineup = currentLineupPlayers.find(p => p.id === yearlyPlayerId);
						return (
							<Div key={idx} style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
								<span style={{ minWidth: '60px' }}>{idx + 1}번 타자</span>
								<select value={yearlyPlayerId} onChange={(e) => {
									const selectedYearlyPlayerId = e.target.value;
									const selectedPlayer = availablePlayers.find(p => p.id === selectedYearlyPlayerId);
									if (selectedPlayer) {
										const newOrder = [...lineupOrder]; newOrder[idx] = selectedYearlyPlayerId; setLineupOrder(newOrder);
										setCurrentLineupPlayers(prev => prev.map((p, i) => i === idx ? selectedPlayer : p));
									}
								}} style={{ flex: 1, padding: '8px' }}>
									{availablePlayers.map(p => <option key={p.id} value={p.id}>{p.name} ({p.year})</option>)}
								</select>
							</Div>
						);
					})}
				</Div>
				<Button style={{ width: '100%', marginTop: '10px' }} onClick={() => setLineupEditOpen(false)}>확인</Button>
			</BottomSheet>

			<BottomSheet isOpen={isRunnerOpen} onClose={() => setRunnerOpen(false)} title="주자 설정">
				<RunnerInput ref={runnerRef} initialStats={lineupRunnerStats} onDataChange={handleRunnerDataChange} />
			</BottomSheet>

			<BottomSheet isOpen={isBatterEditOpen} onClose={() => setBatterEditOpen(false)} title="타자 정보 편집">
				<BatterInput ref={batterRef} initialStats={editingPlayerStats || undefined} onDataChange={handleBatterDataChange} />
				<Button onClick={handleSaveEditedPlayerStats} style={{ marginTop: '10px', backgroundColor: '#4CAF50', color: 'white' }}>저장하고 닫기</Button>
			</BottomSheet>

			<FixedFooter>
				<Box className="container">
					<Div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
						{isEditMode ? <>
						<Button onClick={() => setPlayerListOpen(true)}>선수 명단</Button>
						<Button onClick={() => setLineupEditOpen(true)}>타순 설정</Button>
						<Button onClick={() => setRunnerOpen(true)}>주자 설정</Button>
						</> : <Button onClick={() => navigate('/lineup')}>목록</Button>}
						<Button onClick={() => setIsToolMenuOpen(true)}>도구 추가</Button>
					</Div>
				</Box>
			</FixedFooter>
		</Div>
	);
}

export default NewLineupPage;