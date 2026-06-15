import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Div, Button, FixedFooter, BottomSheet, InputNumber, vars } from '@shared/bridges/UIBridge';
import { PageHeader } from '../../common/components/PageHeader';
import { VisualizerList } from '../../common/components/VisualizerList';
import BatterInput, { BatterInputHandle } from '@sit-val/components/BatterInput';
import RunnerInput, { RunnerInputHandle } from '@sit-val/components/RunnerInput';
import { db } from '../../services/db';
import { BatterStatsData, BatterStats } from '@sit-val/types/BatterStats';
import { RunnerStats } from '@sit-val/types/RunnerStats';
import { ExtendedBatterStats, YearlyPlayer, Player } from '@packages/sit-val/types/Database';
import { LineupPlayerDisplay } from '../LineupPage';
import { ListItemCard } from '../../common/components/ListItemCard';
import * as Hangul from 'hangul-js';

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
	activeTools: Array<{ type: string, name: string, Component: React.ComponentType<any>, props?: any }>;
	setActiveTools: (tools: any) => void;
	vizData: any;
	setIsToolMenuOpen: (val: boolean) => void;
	isToolMenuOpen: boolean; // Add this line
	addTool: (option: { type: string, name: string, Component: React.ComponentType<any>, props?: any }) => void;
	toolOptions: Array<{ type: string, name: string, Component: React.ComponentType<any>, props?: any }>;
}

const LineupEditPage: React.FC<LineupEditPageProps> = ({
	id, lineupName, setLineupName, selectedYear, setSelectedYear, availablePlayers, setAvailablePlayers,
	currentLineupPlayers, setCurrentLineupPlayers, lineupOrder, setLineupOrder,
	lineupRunnerStats, setLineupRunnerStats, isToolMenuOpen, setIsToolMenuOpen, setActiveTools,
	activeTools, vizData, addTool, toolOptions
}) => {
	const navigate = useNavigate();
	const batterRef = useRef<BatterInputHandle>(null);
	const runnerRef = useRef<RunnerInputHandle>(null);

	const [isLineupEditOpen, setLineupEditOpen] = useState(false);
	const [isRunnerOpen, setRunnerOpen] = useState(false);
	const [isBatterEditOpen, setBatterEditOpen] = useState(false);
	const [isMetaOpen, setIsMetaOpen] = useState(false);
	const [editingYearlyPlayerId, setEditingYearlyPlayerId] = useState<string | null>(null);
	const [editingPlayerStats, setEditingPlayerStats] = useState<BatterStatsData | null>(null);
	
	const [isPlayerSelectOpen, setPlayerSelectOpen] = useState(false);
	const [playerSearchTerm, setPlayerSearchTerm] = useState('');
	const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);
	const [newPlayerName, setNewPlayerName] = useState('');
	const [allSearchablePlayers, setAllSearchablePlayers] = useState<LineupPlayerDisplay[]>([]);

	useEffect(() => {
		const loadAll = async () => {
			const data = await db.getAllYearlyPlayersWithNames();
			// 최신 연도 순으로 정렬하여 검색 편의성 제공
			setAllSearchablePlayers(data.sort((a, b) => b.year - a.year));
		};
		loadAll();
	}, []);

	const startEditPlayer = (yearlyPlayerId: string, stats: BatterStatsData) => {
		setEditingYearlyPlayerId(yearlyPlayerId);
		setEditingPlayerStats(stats);
		setBatterEditOpen(true);
	};

	const handleBatterDataChange = (newStats: BatterStatsData) => {
		if (!editingYearlyPlayerId) return;
		setEditingPlayerStats(newStats);
	};

	const handleSaveEditedPlayerStats = useCallback(async () => {
		if (!editingYearlyPlayerId || !editingPlayerStats) return alert('저장할 데이터가 없습니다.');
		const originalYearlyPlayer = availablePlayers.find(p => p.id === editingYearlyPlayerId);
		if (!originalYearlyPlayer) return alert('원본 선수를 찾을 수 없습니다.');
		const dataToSave: Omit<YearlyPlayer, 'creatorId'> = { ...originalYearlyPlayer, stats: { ...editingPlayerStats, r: 0, rbi: 0 } as ExtendedBatterStats };
		try {
			await db.saveYearlyPlayer(dataToSave);
			const updatedPlayers = await db.getPlayersWithYearlyStats(selectedYear);
			setAvailablePlayers(updatedPlayers);
			setBatterEditOpen(false);
		} catch (e: any) { alert(e.message); }
	}, [editingYearlyPlayerId, editingPlayerStats, availablePlayers, selectedYear, setAvailablePlayers]);

	const handleAddNewPlayerToDB = async () => {
		const newPlayerId = `new-player-${Date.now()}`;
		const newPlayerBase: Player = { id: newPlayerId, name: `새 선수 ${Date.now()}` };
		await db.addPlayer(newPlayerBase);
		const user = await db.getCurrentUser();
		const newYearlyPlayer: YearlyPlayer & { name: string } = {
			id: `${newPlayerId}-${selectedYear}-${Date.now()}`, playerId: newPlayerId, name: newPlayerBase.name, year: selectedYear, yearlyTeamIds: [],
			stats: { '1B': 0, '2B': 0, '3B': 0, hr: 0, bb: 0, so: 0, go: 0, fo: 0, sf: 0, sh: 0, hbp: 0, pa: 0, r: 0, rbi: 0 },
			creatorId: user?.id || 'unknown',
		};
		await db.saveYearlyPlayer(newYearlyPlayer);
		setAvailablePlayers(prev => [...prev, newYearlyPlayer as LineupPlayerDisplay]);
		startEditPlayer(newYearlyPlayer.id, newYearlyPlayer.stats);
	};

	const handleSaveLineupStats = useCallback(async () => {
		const user = await db.getCurrentUser();
		if (!user) {
			if (confirm('로그인이 필요한 기능입니다. 현재 내용을 임시 저장하고 로그인 페이지로 이동하시겠습니까?')) {
				const pendingData = { lineupName, selectedYear, lineupOrder, lineupRunnerStats };
				localStorage.setItem('pending_lineup_edit', JSON.stringify(pendingData));
				navigate('/login');
			}
			return;
		}
		const res = await db.saveYearlyLineup({
			id: id !== 'new' ? id! : '',
			name: lineupName,
			year: selectedYear,
			playerIds: lineupOrder,
			runnerStats: lineupRunnerStats
		});
		navigate(`/lineup/${res.id}`);
	}, [lineupRunnerStats, lineupOrder, selectedYear, lineupName, id, navigate]);

	const filteredSearchPlayers = useMemo(() => {
		const term = playerSearchTerm.trim();
		if (!term) return allSearchablePlayers.slice(0, 50); // 초기 상태는 상위 50명만 표시
		const lowerTerm = term.toLowerCase();
		return allSearchablePlayers.filter(p => 
			(p.name && Hangul.search(p.name, term) >= 0) || 
			(p.year && p.year.toString().includes(lowerTerm)) ||
			(p.id && p.id.toLowerCase().includes(lowerTerm))
		).slice(0, 100); // 검색 결과 성능 최적화
	}, [allSearchablePlayers, playerSearchTerm]);

	const handleSelectPlayer = (selectedPlayer: LineupPlayerDisplay) => {
		if (activeSlotIndex === null) return;

		// 선택된 선수가 현재 가용 선수 목록에 없으면 추가 (편집 기능 및 데이터 정합성 유지)
		setAvailablePlayers(prev => {
			if (prev.find(p => p.id === selectedPlayer.id)) return prev;
			return [...prev, selectedPlayer];
		});

		const newOrder = [...lineupOrder];
		newOrder[activeSlotIndex] = selectedPlayer.id;
		setLineupOrder(newOrder);
		setCurrentLineupPlayers((prev: LineupPlayerDisplay[]) => prev.map((p, i) => i === activeSlotIndex ? selectedPlayer : p));
		setPlayerSelectOpen(false);
	};

	const handleCreateAndSelectNewPlayer = async () => {
		if (activeSlotIndex === null) return;
		const nameToUse = newPlayerName || playerSearchTerm || `새 선수 ${Date.now()}`;
		const newPlayerId = `new-player-${Date.now()}`;
		await db.addPlayer({ id: newPlayerId, name: nameToUse });
		const user = await db.getCurrentUser();
		const defaultStats: BatterStatsData = { '1B': 0, '2B': 0, '3B': 0, hr: 0, bb: 0, so: 0, go: 0, fo: 0, sf: 0, sh: 0, hbp: 0 };
		const newYearlyPlayer: YearlyPlayer & { name: string } = {
			id: `${newPlayerId}-${selectedYear}-${Date.now()}`, playerId: newPlayerId, name: nameToUse, year: selectedYear, yearlyTeamIds: [],
			stats: { ...defaultStats, pa: 0, r: 0, rbi: 0 } as ExtendedBatterStats,
			creatorId: user?.id || 'unknown',
		};
		await db.saveYearlyPlayer(newYearlyPlayer);
		setAvailablePlayers(prev => [...prev, newYearlyPlayer as LineupPlayerDisplay]);
		handleSelectPlayer(newYearlyPlayer as LineupPlayerDisplay);
	};

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
				onToolsSync={setActiveTools}
				toolOptions={toolOptions}
				onAddTool={addTool}
				isToolMenuOpen={isToolMenuOpen}
				setIsToolMenuOpen={setIsToolMenuOpen}
				storageKey="lineup-visualizer-layout"
			/>

			<BottomSheet isOpen={isLineupEditOpen} onClose={() => setLineupEditOpen(false)} title="타순 설정">
				<Div style={{ flex: 1, overflowY: 'auto', padding: '10px 20px 20px 20px', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '400px' }}>
					{lineupOrder.map((yearlyPlayerId, idx) => (
						<ListItemCard 
							key={idx} 
							onClick={() => {
								setActiveSlotIndex(idx);
								setPlayerSearchTerm('');
								setNewPlayerName('');
								setPlayerSelectOpen(true);
							}}
							style={{ padding: '12px', borderRadius: '10px' }}
						>
							<Div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1 }}>
								<Div style={{ 
									backgroundColor: vars.secondary, 
									color: 'white', 
									width: '28px', 
									height: '28px', 
									borderRadius: '50%', 
									display: 'flex', 
									alignItems: 'center', 
									justifyContent: 'center',
									fontSize: '13px',
									fontWeight: 'bold',
									flexShrink: 0
								}}>{idx + 1}</Div>
								<Div style={{ flex: 1, display: 'flex', alignItems: 'baseline', gap: '8px' }}>
									<span style={{ fontSize: '16px', fontWeight: 600, color: vars.text }}>{currentLineupPlayers[idx]?.name || '선수 선택'}</span>
									<span style={{ fontSize: '12px', opacity: 0.5 }}>({currentLineupPlayers[idx]?.year || selectedYear})</span>
								</Div>
							</Div>
							<Button 
								style={{ padding: '6px 12px', fontSize: '12px', marginLeft: '10px' }} 
								onClick={(e) => {
									e.stopPropagation(); // 카드 클릭(선수 선택) 이벤트가 발생하지 않도록 차단
									const p = currentLineupPlayers[idx];
									if (p && !p.id.startsWith('placeholder')) {
										startEditPlayer(p.id, p.stats);
									} else {
										alert('선수를 먼저 선택하거나 생성해주세요.');
									}
								}}
							>편집</Button>
						</ListItemCard>
					))}
					<Button style={{ width: '100%', }} onClick={() => setLineupEditOpen(false)}>확인</Button>
				</Div>
			</BottomSheet>

			<BottomSheet isOpen={isPlayerSelectOpen} onClose={() => setPlayerSelectOpen(false)} title={`${activeSlotIndex !== null ? activeSlotIndex + 1 : ''}번 타자 선택`}>
				<Div style={{ padding: '0 20px 20px 20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
					<input 
						placeholder="선수 이름 검색..." 
						value={playerSearchTerm} 
						onChange={(e) => setPlayerSearchTerm(e.target.value)}
						style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box' }}
					/>
					
					<Div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px' }}>
						{filteredSearchPlayers.map(p => (
							<ListItemCard 
								key={p.id} 
								onClick={() => handleSelectPlayer(p)}
								style={{ marginBottom: '4px' }}
							>
								<Div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
									<Div style={{ 
										backgroundColor: vars.surface, 
										padding: '4px 8px', 
										borderRadius: '6px', 
										fontSize: '12px', 
										fontWeight: 'bold', 
										color: vars.primary 
									}}>{p.year}</Div>
									<span style={{ fontSize: '16px', fontWeight: 600, color: vars.text }}>{p.name}</span>
								</Div>
								<span style={{ fontSize: '11px', color: vars.text, opacity: 0.4 }}>{p.id.split('-')[0]}...</span>
							</ListItemCard>
						))}
						
						{playerSearchTerm.trim() !== '' && filteredSearchPlayers.length === 0 && (
							<Div style={{ padding: '30px 20px', textAlign: 'center', backgroundColor: '#fffbe6', border: '1px solid #ffe58f', borderRadius: '12px' }}>
								<p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#856404' }}>'{playerSearchTerm}' 선수를 찾을 수 없습니다. 직접 입력하여 추가하시겠습니까?</p>
								<Div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
									<Div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
										<label style={{ fontSize: '12px', minWidth: '60px' }}>선수 이름</label>
										<input 
											value={newPlayerName || playerSearchTerm} 
											onChange={(e) => setNewPlayerName(e.target.value)}
											style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
										/>
									</Div>
									<Button 
										onClick={handleCreateAndSelectNewPlayer}
										style={{ backgroundColor: '#4CAF50', color: 'white' }}
									>이 이름으로 새 선수 생성 및 선택</Button>
								</Div>
							</Div>
						)}
					</Div>
				</Div>
			</BottomSheet>

			<BottomSheet isOpen={isRunnerOpen} onClose={() => setRunnerOpen(false)} title="주자 설정">
				<RunnerInput ref={runnerRef} initialStats={lineupRunnerStats} onDataChange={setLineupRunnerStats} />
			</BottomSheet>

			<BottomSheet isOpen={isMetaOpen} onClose={() => setIsMetaOpen(false)} title={`${lineupName} 정보 설정`}>
				<Div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
					<Div style={{display: "flex", flexDirection: 'row', gap: "10px", alignItems: 'center'}}>
						<label style={{ display: 'block', marginBottom: '5px', minWidth: '100px' }}>라인업 이름</label>
						<InputNumber type="text" value={lineupName} onChange={(e) => setLineupName(e.target.value)} />
					</Div>
					<Div style={{display: "flex", flexDirection: 'row', gap: "10px", alignItems: 'center'}}>
						<label style={{ display: 'block', marginBottom: '5px', minWidth: '100px' }}>연도</label>
						<InputNumber value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} />
					</Div>
					<Button onClick={() => setIsMetaOpen(false)} disabled={!isMetaValid} style={{ marginTop: '15px', width: '100%', backgroundColor: isMetaValid ? undefined : '#ccc', cursor: isMetaValid ? 'pointer' : 'not-allowed' }}>확인</Button>
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
						<Button onClick={() => setLineupEditOpen(true)}>타순 설정</Button>
						<Button onClick={() => setRunnerOpen(true)}>주자 설정</Button>
					</Div>
				</Box>
			</FixedFooter>
		</Div>
	);
};

export default LineupEditPage;