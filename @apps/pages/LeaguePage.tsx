import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Div } from '@shared/bridges/UIBridge';
import * as TransitionEngine from '@sit-val/lib/transition-engine/'
import * as Calc from "@sit-val/lib/sabermetrics/calc";
import { db } from '../services/db';
import { calculateRE } from '../features/league/api/re-league';
import { BatterStatsData } from '@sit-val/types/BatterStats';
import { RunnerStats } from '@sit-val/types/RunnerStats';
import Visualizer9RE from '../features/league/components/Visualizer9RE';
import RE24Visualizer from '../features/league/components/RE24Visualizer';
import LeagueVisualizer from '../features/league/components/LeagueVisualizer';
import RunValueVisualizer from '../features/league/components/RunValueVisualizer';
import PersonalVisualizer from '../features/league/components/PersonalVisualizer';
import { ExtendedBatterStats } from '../types/Database';
import { calculateBatterAbility } from '../common/api/stats';

// 서브 페이지 임포트
import LeagueSearchPage from './league/LeagueSearchPage';
import LeagueInfoPage from './league/LeagueInfoPage';
import LeagueEditPage from './league/LeagueEditPage';

const INITIAL_BATTER_STATS: BatterStatsData = { '1B': 65, '2B': 23, '3B': 0, hr: 56, bb: 111, so: 89, go: 117, fo: 135, sf: 6, sh: 0, hbp: 0, pa: 596 };
const INITIAL_RUNNER_STATS: RunnerStats = { passedball: 0.03, s_r1_r2_safe: 0.10, s_r1_r2_out: 0.03, s_r2_r3_safe: 0.004, s_r2_r3_out: 0.001, '1B_r2_home_safe': 0.40, '1B_r2_home_out': 0.05, '1B_r2_r3_safe': 0.55, '1B_r1_r3_safe': 0.30, '1B_r1_r3_out': 0.05, '1B_r1_r2_safe': 0.65, '2B_r1_home_safe': 0.7, '2B_r1_home_out': 0.05, '2B_r1_r3_safe': 0.25, fo_r3_home_safe: 0.85, fo_r3_home_out: 0.05, fo_r3_r3_safe: 0.10, go_r1_r2_out: 0.3, go_b_r1_out: 0.3 };

const TOOL_OPTIONS = [
	{ name: 'Visualizer 9RE', Component: Visualizer9RE },
	{ name: 'RE24 Visualizer', Component: RE24Visualizer },
	{ name: 'League Visualizer', Component: LeagueVisualizer },
	{ name: 'Run Value Visualizer', Component: RunValueVisualizer },
	{ name: 'Personal Visualizer', Component: PersonalVisualizer },
];

function LeaguePage() {
	const { id } = useParams();
	const [searchParams] = useSearchParams();
	const transitionEngine = useMemo(() => new TransitionEngine.Standard(), []);
	const [isEditMode, setIsEditMode] = useState(false), [leagueBatterStats, setLeagueBatterStats] = useState<BatterStatsData>(INITIAL_BATTER_STATS), [leagueRunnerStats, setLeagueRunnerStats] = useState(INITIAL_RUNNER_STATS);
	const [isToolMenuOpen, setIsToolMenuOpen] = useState(false);
	const [selectedYear, setSelectedYear] = useState<number>(2024), [leagueIdInput, setLeagueIdInput] = useState<string>('kbo');
	const [vizData, setVizData] = useState<any>(null), [activeTools, setActiveTools] = useState<any[]>([{ id: 1, Component: Visualizer9RE }, { id: 2, Component: RE24Visualizer }, { id: 3, Component: LeagueVisualizer }, { id: 4, Component: RunValueVisualizer }, { id: 5, Component: PersonalVisualizer }]);

	useEffect(() => {
		const targetId = id === 'new' ? searchParams.get('from') : id;
		if (!id) return;
		const data = targetId ? db.getYearlyLeagueById(targetId) : null;
		if (id !== 'new' && !data) return; 
		if (data) { setLeagueBatterStats(data.stats); setSelectedYear(data.year); setLeagueIdInput(data.leagueId); }
		setIsEditMode(id === 'new');
	}, [id, searchParams]);

	const addTool = (Component: React.ComponentType<any>) => {
		setActiveTools(prev => [...prev, { id: Date.now(), Component }]);
		setIsToolMenuOpen(false);
	};

	const execute = useCallback(() => {
		const stats = calculateBatterAbility(leagueBatterStats);
		const ret = calculateRE(stats, leagueRunnerStats, transitionEngine);
		const weights = Calc.calculateWeightedRunValue({ ...leagueBatterStats, pa: stats.pa }, ret['runValue']); const lgWobaRaw = Calc.calculateCustomWOBA(weights, { ...leagueBatterStats, pa: stats.pa });
		setVizData([ret, weights, lgWobaRaw, 0.33 / lgWobaRaw, Calc.calculateLeagueRunPerPA(ret.R[0], { ...leagueBatterStats, pa: stats.pa })]);
	}, [leagueBatterStats, leagueRunnerStats, transitionEngine]);

	const handleSave = useCallback(() => {
		const leagueData = { id: id !== 'new' ? id! : `${leagueIdInput}-${selectedYear}-${Date.now()}`, leagueId: leagueIdInput, year: selectedYear, stats: { ...leagueBatterStats, r: 0, rbi: 0 } as ExtendedBatterStats };
		try {
			db.saveYearlyLeague(leagueData); setIsEditMode(false);
		} catch (e: any) { alert(e.message); }
	}, [leagueBatterStats, selectedYear, leagueIdInput, id]);

	useEffect(() => { execute(); }, [execute]);

	const isMetaValid = leagueIdInput.trim() !== '' && !isNaN(selectedYear) && selectedYear > 0;

	if (!id) return <LeagueSearchPage />;
	if (id !== 'new' && !db.getYearlyLeagueById(id)) return <Div style={{ padding: '40px' }}>404 - 리그를 찾을 수 없습니다.</Div>;

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
			onRemoveTool={(id: number) => setActiveTools(prev => prev.filter(t => t.id !== id))}
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
			onRemoveTool={(id: number) => setActiveTools(prev => prev.filter(t => t.id !== id))}
			vizData={vizData}
			isToolMenuOpen={isToolMenuOpen} setIsToolMenuOpen={setIsToolMenuOpen}
			addTool={addTool} toolOptions={TOOL_OPTIONS}
		/>
	);
}

export default LeaguePage