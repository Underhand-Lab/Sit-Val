import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Div } from '@shared/bridges/UIBridge';
import * as TransitionEngine from '@sit-val/lib/transition-engine/'
import * as Calc from "@sit-val/lib/sabermetrics/calc";
import { db } from '../services/db';
import { calculateRE, RECalculationResult } from '../features/league/api/re-league';
import { BatterStatsData, BatterStats } from '@sit-val/types/BatterStats';
import { RunnerStats } from '@sit-val/types/RunnerStats';

import LeagueVisualizer from '../features/league/components/LeagueVisualizer';
import RunValueVisualizer from '../features/league/components/RunValueVisualizer';
import PersonalVisualizer from '../features/league/components/PersonalVisualizer';

import { ExtendedBatterStats, YearlyLeague } from '../types/Database';
import { calculateBatterAbility } from '../common/api/stats';
import { calculateBasicStats } from '../common/api/baseball';
import { BasicStats } from '../types/BasicStats';

// 서브 페이지 임포트
import LeagueSearchPage from './league/LeagueSearchPage';
import LeagueInfoPage from './league/LeagueInfoPage';
import LeagueEditPage from './league/LeagueEditPage';
import RE24Visualizer from '@apps/features/league/components/RE24Visualizer';
import LeagueBigInningVisualizer from '@apps/features/league/components/LeagueBigInningVisualizer';

const INITIAL_BATTER_STATS: BatterStatsData = { '1B': 65, '2B': 23, '3B': 0, hr: 56, bb: 111, so: 89, go: 117, fo: 135, sf: 6, sh: 0, hbp: 0 };
const INITIAL_RUNNER_STATS: RunnerStats = { passedball: 0.03, s_r1_r2_safe: 0.10, s_r1_r2_out: 0.03, s_r2_r3_safe: 0.004, s_r2_r3_out: 0.001, '1B_r2_home_safe': 0.40, '1B_r2_home_out': 0.05, '1B_r2_r3_safe': 0.55, '1B_r1_r3_safe': 0.30, '1B_r1_r3_out': 0.05, '1B_r1_r2_safe': 0.65, '2B_r1_home_safe': 0.7, '2B_r1_home_out': 0.05, '2B_r1_r3_safe': 0.25, fo_r3_home_safe: 0.85, fo_r3_home_out: 0.05, fo_r3_r3_safe: 0.10, go_r1_r2_out: 0.3, go_b_r1_out: 0.3 };

const TOOL_OPTIONS = [
	{ name: '리그 정보', Component: LeagueVisualizer },
	{ name: 'RE24', Component: RE24Visualizer },
	{ name: '득점 확률', Component: LeagueBigInningVisualizer },
	{ name: '타구 가치', Component: RunValueVisualizer },
	{ name: '개인 가치', Component: PersonalVisualizer },
];

function LeaguePage() {
	const { id } = useParams();
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const transitionEngine = useMemo(() => new TransitionEngine.Standard(), []);
	const [yearlyLeagueData, setYearlyLeagueData] = useState<YearlyLeague | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isEditMode, setIsEditMode] = useState(false), [leagueBatterStats, setLeagueBatterStats] = useState<BatterStatsData>(INITIAL_BATTER_STATS), [leagueRunnerStats, setLeagueRunnerStats] = useState(INITIAL_RUNNER_STATS);
	const [isToolMenuOpen, setIsToolMenuOpen] = useState(false);
	const [selectedYear, setSelectedYear] = useState<number>(2024), [leagueIdInput, setLeagueIdInput] = useState<string>('kbo');
	const [vizData, setVizData] = useState<[RECalculationResult, Calc.WOBAWeights, number, number, number, BasicStats] | null>(null);
	const [activeTools, setActiveTools] = useState<Array<{ id: string, name: string, Component: React.ComponentType<any>, props?: Record<string, any> }>>([
		{ id: '1', name: '리그 정보', Component: LeagueVisualizer },
		{ id: '2', name: '타구 가치', Component: RunValueVisualizer }, 
		{ id: '3', name: '개인 가치', Component: PersonalVisualizer }
	]);

	useEffect(() => {
		const fetchData = async () => {
			setIsLoading(true);
			const targetId = id === 'new' ? searchParams.get('from') : id;
			if (!id) return;
			const data = targetId ? await db.getYearlyLeagueById(targetId) : null;
			if (data) { 
				setYearlyLeagueData(data);
				setLeagueBatterStats(data.stats); 
				setSelectedYear(data.year); 
				setLeagueIdInput(data.leagueId); 
			}
			setIsEditMode(id === 'new');

			// 임시 저장된 데이터 복구
			const pending = localStorage.getItem('pending_league_edit');
			if (pending) {
				const pData = JSON.parse(pending);
				setLeagueBatterStats(pData.leagueBatterStats);
				setSelectedYear(pData.selectedYear);
				setLeagueIdInput(pData.leagueIdInput);
				setLeagueRunnerStats(pData.leagueRunnerStats);
				localStorage.removeItem('pending_league_edit');
			}
			setIsLoading(false);
		};
		fetchData();
	}, [id, searchParams]);

	const addTool = (option: { name: string, Component: React.ComponentType<any>, props?: any }) => {
		setActiveTools(prev => [...prev, { id: Date.now().toString(), name: option.name, Component: option.Component, props: option.props }]);
		setIsToolMenuOpen(false);
	};

	const onRemoveTool = (id: string) => {
		setActiveTools(prev => prev.filter(t => t.id !== id));
	};

	const execute = useCallback(() => {
		const batterStats = new BatterStats(leagueBatterStats);
		const ability = calculateBatterAbility(batterStats);
		const basic = calculateBasicStats(batterStats);
		const ret = calculateRE(ability, leagueRunnerStats, transitionEngine);
		const weights = Calc.calculateWeightedRunValue(batterStats, ret['runValue']); 
		const lgWobaRaw = Calc.calculateCustomWOBA(weights, batterStats);
		setVizData([ret, weights, lgWobaRaw, 0.33 / lgWobaRaw, Calc.calculateLeagueRunPerPA(ret.R[0], batterStats), basic]);
	}, [leagueBatterStats, leagueRunnerStats, transitionEngine]);

	const handleSave = useCallback(async () => {
		const user = await db.getCurrentUser();
		if (!user) {
			if (confirm('로그인이 필요한 기능입니다. 현재 내용을 임시 저장하고 로그인 페이지로 이동하시겠습니까?')) {
				const pendingData = { leagueIdInput, selectedYear, leagueBatterStats, leagueRunnerStats };
				localStorage.setItem('pending_league_edit', JSON.stringify(pendingData));
				navigate('/login');
			}
			return;
		}
		const actualId = id === 'new' ? (searchParams.get('from') || '') : id!;
		const leagueData = { id: actualId, leagueId: leagueIdInput, year: selectedYear, stats: { ...leagueBatterStats, r: 0, rbi: 0 } };
		try {
			await db.saveYearlyLeague(leagueData); setIsEditMode(false);
		} catch (e: any) { alert(e.message); }
	}, [leagueBatterStats, selectedYear, leagueIdInput, id]);

	useEffect(() => { execute(); }, [execute]);

	const isMetaValid = leagueIdInput.trim() !== '' && !isNaN(selectedYear) && selectedYear > 0;

	if (!id) return <LeagueSearchPage />;
	if (isLoading) return <Div style={{ padding: '40px' }}>데이터를 불러오는 중...</Div>;
	if (id !== 'new' && !yearlyLeagueData) return <Div style={{ padding: '40px' }}>404 - 리그를 찾을 수 없습니다.</Div>;

	return isEditMode ? (
		<LeagueEditPage
			id={id}
			leagueIdInput={leagueIdInput} setLeagueIdInput={setLeagueIdInput}
			selectedYear={selectedYear} setSelectedYear={setSelectedYear}
			leagueBatterStats={leagueBatterStats} setLeagueBatterStats={setLeagueBatterStats}
			leagueRunnerStats={leagueRunnerStats} setLeagueRunnerStats={setLeagueRunnerStats}
			handleSave={handleSave}
			isMetaValid={isMetaValid}
			activeTools={activeTools}
			onRemoveTool={onRemoveTool}
			vizData={vizData}
			isToolMenuOpen={isToolMenuOpen} setIsToolMenuOpen={setIsToolMenuOpen}
			addTool={addTool} toolOptions={TOOL_OPTIONS}
		/>
	) : (
		<LeagueInfoPage
			id={id}
			leagueIdInput={leagueIdInput}
			selectedYear={selectedYear}
			activeTools={activeTools}
			onRemoveTool={onRemoveTool}
			vizData={vizData}
			isToolMenuOpen={isToolMenuOpen} setIsToolMenuOpen={setIsToolMenuOpen}
			addTool={addTool} toolOptions={TOOL_OPTIONS}
		/>
	);
}

export default LeaguePage