import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Div, Button, FixedFooter, BottomSheet } from '@shared/bridges/UIBridge';
import { PageHeader } from '../../common/components/PageHeader';
import { VisualizerList } from '../../common/components/VisualizerList';
import BatterInput, { BatterInputHandle } from '@sit-val/components/BatterInput';
import RunnerInput, { RunnerInputHandle } from '@sit-val/components/RunnerInput';
import { db } from '../../services/db';
import { BatterStatsData } from '@sit-val/types/BatterStats';
import { RunnerStats } from '@sit-val/types/RunnerStats';
import { YearlyPlayer, Player } from '@packages/sit-val/types/Database';
import { LineupPlayerDisplay } from '../LineupPage';

interface LineupEditPageProps {
	id: string; 
	lineupName: string;
	setLineupName: (val: string) => void;
	selectedYear: number;
	setSelectedYear: (val: number) => void;
	availablePlayers: LineupPlayerDisplay[];
	setAvailablePlayers: React.Dispatch<React.SetStateAction<LineupPlayerDisplay[]>>;
	currentLineupPlayers: LineupPlayerDisplay[];
	setCurrentLineupPlayers: React.Dispatch<React.SetStateAction<LineupPlayerDisplay[]>>;
	lineupOrder: string[];
	setLineupOrder: React.Dispatch<React.SetStateAction<string[]>>;
	lineupRunnerStats: RunnerStats;
	setLineupRunnerStats: (val: RunnerStats) => void;
	activeTools: Array<{ id: string, name: string, Component: React.ComponentType<any> }>;
	onRemoveTool: (id: string) => void;
	vizData: any;
	setIsToolMenuOpen: (val: boolean) => void;
	isToolMenuOpen: boolean; // Add this line
	addTool: (option: { name: string, Component: React.ComponentType<any> }) => void;
	toolOptions: Array<{ name: string, Component: React.ComponentType<any> }>;
}

const LineupEditPage: React.FC<LineupEditPageProps> = ({
	id, lineupName, setLineupName, selectedYear, setSelectedYear, availablePlayers, setAvailablePlayers,
	currentLineupPlayers, setCurrentLineupPlayers, lineupOrder, setLineupOrder,
	lineupRunnerStats, setLineupRunnerStats, isToolMenuOpen, setIsToolMenuOpen,
	activeTools, onRemoveTool, vizData, addTool, toolOptions
}) => {
	const navigate = useNavigate();
	const batterRef = useRef<BatterInputHandle>(null);
	const runnerRef = useRef<RunnerInputHandle>(null);

	const [isPlayerListOpen, setPlayerListOpen] = useState(false);
	const [isLineupEditOpen, setLineupEditOpen] = useState(false);
	const [isRunnerOpen, setRunnerOpen] = useState(false);
	const [isBatterEditOpen, setBatterEditOpen] = useState(false);
	const [isMetaOpen, setIsMetaOpen] = useState(false);
	const [editingYearlyPlayerId, setEditingYearlyPlayerId] = useState<string | null>(null);
	const [editingPlayerStats, setEditingPlayerStats] = useState<BatterStatsData | null>(null);

	const startEditPlayer = (yearlyPlayerId: string, stats: BatterStatsData) => {
		setEditingYearlyPlayerId(yearlyPlayerId);
		setEditingPlayerStats(stats);
		setBatterEditOpen(true);
	};

	const handleBatterDataChange = (newStats: BatterStatsData) => {
		if (!editingYearlyPlayerId) return;
		setEditingPlayerStats(newStats);
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
	}, [editingYearlyPlayerId, editingPlayerStats, availablePlayers, selectedYear, setAvailablePlayers]);

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

	const handleSaveLineupStats = useCallback(() => {
		const res = db.saveYearlyLineup({
			id: id !== 'new' ? id! : '',
			name: lineupName,
			year: selectedYear,
			playerIds: lineupOrder,
			runnerStats: lineupRunnerStats
		});
		navigate(`/lineup/${res.id}`);
	}, [lineupRunnerStats, lineupOrder, selectedYear, lineupName, id, navigate]);

	const isMetaValid = lineupName.trim() !== '' && !isNaN(selectedYear) && selectedYear > 0;

	return (
		<Div id="wrapper">
			<PageHeader
				title={`${lineupName} (${selectedYear})`}
				subTitle={id}
				isEditMode={true}
				onEditToggle={() => navigate(-1)}
				onSave={handleSaveLineupStats}
				showSave={true}
				isSaveDisabled={!isMetaValid}
			/>

			<VisualizerList 
				tools={activeTools} 
				data={vizData} 
				onRemove={onRemoveTool} 
				toolOptions={toolOptions}
				onAddTool={addTool}
			/>

			<BottomSheet isOpen={isPlayerListOpen} onClose={() => setPlayerListOpen(false)} title="선수 명단">
				<Div style={{ flex: 1, overflowY: 'auto' }}>
					{availablePlayers.length === 0 && <p>등록된 선수가 없습니다. 새 선수를 추가해주세요.</p>}
					{availablePlayers.map(p => (
						<Div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #eee', gap: '10px' }}>
							<span>{p.name}</span>
							<Div style={{ display: 'flex', gap: '5px' }}>
								<Button style={{ padding: '5px 10px' }} onClick={() => startEditPlayer(p.id, p.stats)}>편집</Button>
								<Button style={{ padding: '5px 10px', backgroundColor: '#007bff', color: 'white' }} onClick={() => {
									if (currentLineupPlayers.length < 9) {
										setCurrentLineupPlayers((prev: LineupPlayerDisplay[]) => [...prev, p]);
										setLineupOrder((prev: string[]) => [...prev, p.id]);
									}
								}}>라인업 추가</Button>
							</Div>
						</Div>
					))}
				</Div>
				<Button style={{ width: '100%', marginTop: '15px' }} onClick={handleAddNewPlayerToDB}>새 선수 추가</Button>
			</BottomSheet>

			<BottomSheet isOpen={isLineupEditOpen} onClose={() => setLineupEditOpen(false)} title="타순 설정">
				<Div style={{ flex: 1, overflowY: 'auto', paddingBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
					{lineupOrder.map((yearlyPlayerId, idx) => (
						<Div key={idx} style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
							<span style={{ minWidth: '60px' }}>{idx + 1}번 타자</span>
							<select value={yearlyPlayerId} onChange={(e) => {
								const selectedYearlyPlayerId = e.target.value;
								const selectedPlayer = availablePlayers.find(p => p.id === selectedYearlyPlayerId);
								if (selectedPlayer) {
									const newOrder = [...lineupOrder]; newOrder[idx] = selectedYearlyPlayerId; setLineupOrder(newOrder);
									setCurrentLineupPlayers((prev: LineupPlayerDisplay[]) => prev.map((p, i) => i === idx ? selectedPlayer : p));
								}
							}} style={{ flex: 1, padding: '8px' }}>
								{availablePlayers.map(p => <option key={p.id} value={p.id}>{p.name} ({p.year})</option>)}
							</select>
						</Div>
					))}
				</Div>
				<Button style={{ width: '100%', marginTop: '10px' }} onClick={() => setLineupEditOpen(false)}>확인</Button>
			</BottomSheet>

			<BottomSheet isOpen={isRunnerOpen} onClose={() => setRunnerOpen(false)} title="주자 설정">
				<RunnerInput ref={runnerRef} initialStats={lineupRunnerStats} onDataChange={setLineupRunnerStats} />
			</BottomSheet>

			<BottomSheet isOpen={isMetaOpen} onClose={() => setIsMetaOpen(false)} title={`${lineupName} 정보 설정`}>
				<Div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
					<Div>
						<label style={{ display: 'block', marginBottom: '5px' }}>라인업 이름</label>
						<input type="text" value={lineupName} onChange={(e) => setLineupName(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />
					</Div>
					<Div>
						<label style={{ display: 'block', marginBottom: '5px' }}>연도</label>
						<input type="number" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />
					</Div>
					<Button onClick={() => setIsMetaOpen(false)} disabled={!isMetaValid} style={{ marginTop: '10px', backgroundColor: isMetaValid ? undefined : '#ccc', cursor: isMetaValid ? 'pointer' : 'not-allowed' }}>확인</Button>
				</Div>
			</BottomSheet>

			<BottomSheet isOpen={isBatterEditOpen} onClose={() => setBatterEditOpen(false)} title="타자 정보 편집">
				<BatterInput ref={batterRef} initialStats={editingPlayerStats || undefined} onDataChange={handleBatterDataChange} />
				<Button onClick={handleSaveEditedPlayerStats} style={{ marginTop: '10px', backgroundColor: '#4CAF50', color: 'white' }}>저장하고 닫기</Button>
			</BottomSheet>

			<FixedFooter>
				<Box className="container">
					<Div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
						<Button onClick={() => setIsMetaOpen(true)}>기본 정보</Button>
						<Button onClick={() => setPlayerListOpen(true)}>선수 명단</Button>
						<Button onClick={() => setLineupEditOpen(true)}>타순 설정</Button>
						<Button onClick={() => setRunnerOpen(true)}>주자 설정</Button>
					</Div>
				</Box>
			</FixedFooter>
		</Div>
	);
};

export default LineupEditPage;