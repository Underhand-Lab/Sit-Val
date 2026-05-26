import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Div, Button, FixedFooter, BottomSheet } from '@shared/bridges/UIBridge';
import * as TransitionEngine from '@sit-val/lib/transition-engine/'
import * as Calc from "@sit-val/lib/sabermetrics/calc";
import BatterInput, { BatterInputHandle } from '@sit-val/components/BatterInput';
import RunnerInput, { RunnerInputHandle } from '@sit-val/components/RunnerInput';
import Popup from '@shared/components/Modal'
import { db } from '../services/db';
import { calculateRE, RECalculationResult } from '../features/league/api/re-league';
import { BatterStatsData } from '@sit-val/types/BatterStats';
import { RunnerStats } from '@sit-val/types/RunnerStats';
import Visualizer9RE from '../features/league/components/Visualizer9RE';
import RE24Visualizer from '../features/league/components/RE24Visualizer';
import LeagueVisualizer from '../features/league/components/LeagueVisualizer';
import RunValueVisualizer from '../features/league/components/RunValueVisualizer';
import LeagueBigInningVisualizer from '../features/league/components/LeagueBigInningVisualizer';
import PersonalVisualizer from '../features/league/components/PersonalVisualizer';
import { ExtendedBatterStats, YearlyLeague } from '../types/Database';
import { calculateBatterAbility } from '../common/api/stats';
import { PageHeader } from '../common/components/PageHeader';
import { VisualizerList } from '../common/components/VisualizerList';
import { DataManagementView } from '../common/components/DataManagementView';

const INITIAL_BATTER_STATS: BatterStatsData = { '1B': 65, '2B': 23, '3B': 0, hr: 56, bb: 111, so: 89, go: 117, fo: 135, sf: 6, sh: 0, hbp: 0, pa: 596 };
const INITIAL_RUNNER_STATS: RunnerStats = { passedball: 0.03, s_r1_r2_safe: 0.10, s_r1_r2_out: 0.03, s_r2_r3_safe: 0.004, s_r2_r3_out: 0.001, '1B_r2_home_safe': 0.40, '1B_r2_home_out': 0.05, '1B_r2_r3_safe': 0.55, '1B_r1_r3_safe': 0.30, '1B_r1_r3_out': 0.05, '1B_r1_r2_safe': 0.65, '2B_r1_home_safe': 0.7, '2B_r1_home_out': 0.05, '2B_r1_r3_safe': 0.25, fo_r3_home_safe: 0.85, fo_r3_home_out: 0.05, fo_r3_r3_safe: 0.10, go_r1_r2_out: 0.3, go_b_r1_out: 0.3 };

function LeaguePage() {
	const { id } = useParams();
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const batterRef = useRef<BatterInputHandle>(null);
	const runnerRef = useRef<RunnerInputHandle>(null);
	const transitionEngine = useMemo(() => new TransitionEngine.Standard(), []);
	const [isBatterOpen, setIsBatterOpen] = useState(false), [isRunnerOpen, setIsRunnerOpen] = useState(false), [isToolMenuOpen, setIsToolMenuOpen] = useState(false);
	const [isEditMode, setIsEditMode] = useState(false), [leagueBatterStats, setLeagueBatterStats] = useState<BatterStatsData>(INITIAL_BATTER_STATS), [leagueRunnerStats, setLeagueRunnerStats] = useState(INITIAL_RUNNER_STATS);
	const [vizData, setVizData] = useState<any>(null), [activeTools, setActiveTools] = useState<any[]>([{ id: 1, Component: Visualizer9RE }, { id: 2, Component: RE24Visualizer }, { id: 3, Component: LeagueVisualizer }, { id: 4, Component: RunValueVisualizer }, { id: 5, Component: PersonalVisualizer }]);

	useEffect(() => {
		const targetId = id === 'new' ? searchParams.get('from') : id;
		if (!id) return;
		const data = targetId ? db.getYearlyLeagueById(targetId) : null;
		if (id !== 'new' && !data) return; 
		if (data) { setLeagueBatterStats(data.stats); }
		setIsEditMode(id === 'new');
	}, [id, searchParams]);

	const execute = useCallback(() => {
		const stats = calculateBatterAbility(leagueBatterStats); const ret = calculateRE(stats, leagueRunnerStats, transitionEngine);
		const weights = Calc.calculateWeightedRunValue({ ...leagueBatterStats, pa: stats.pa }, ret['runValue']); const lgWobaRaw = Calc.calculateCustomWOBA(weights, { ...leagueBatterStats, pa: stats.pa });
		setVizData([ret, weights, lgWobaRaw, 0.33 / lgWobaRaw, Calc.calculateLeagueRunPerPA(ret.R[0], { ...leagueBatterStats, pa: stats.pa })]);
	}, [leagueBatterStats, leagueRunnerStats, transitionEngine]);

	const handleSave = useCallback(() => {
		const year = parseInt(prompt('연도') || '2024');
		const leagueData = { id: id !== 'new' ? id! : `kbo-${year}-${Date.now()}`, leagueId: 'kbo', year, stats: { ...leagueBatterStats, r: 0, rbi: 0 } as ExtendedBatterStats };
		try {
			const res = db.saveYearlyLeague(leagueData); navigate(`/league/${res.id}`); setIsEditMode(false);
		} catch (e: any) { alert(e.message); }
	}, [leagueBatterStats, id, navigate]);

	useEffect(() => { execute(); }, [execute]);

	if (!id) return <DataManagementView title="리그" items={db.getYearlyLeagues('kbo')} createPath="/league/new" renderItem={(l) => <Button onClick={() => navigate(`/league/${l.id}`)}>{l.year} {l.leagueId}</Button>} />;
	if (id !== 'new' && !db.getYearlyLeagueById(id)) return <Div style={{ padding: '40px' }}>404 - 리그를 찾을 수 없습니다.</Div>;

	return (
		<Div id="wrapper">
			<PageHeader title={id === 'new' ? '신규 리그 분석' : '리그 분석'} subTitle={id} isEditMode={isEditMode} onEditToggle={() => isEditMode ? navigate('/league') : navigate(`/league/new?from=${id}`)} onSave={handleSave} showSave={true} />
			<VisualizerList tools={activeTools} data={vizData} onRemove={(id) => setActiveTools(prev => prev.filter(t => t.id !== id))} />
			<BottomSheet isOpen={isBatterOpen} onClose={() => setIsBatterOpen(false)} title="타격 설정"><BatterInput ref={batterRef} initialStats={leagueBatterStats} onDataChange={setLeagueBatterStats} /></BottomSheet>
			<BottomSheet isOpen={isRunnerOpen} onClose={() => setIsRunnerOpen(false)} title="주자 설정"><RunnerInput ref={runnerRef} initialStats={leagueRunnerStats} onDataChange={setLeagueRunnerStats} /></BottomSheet>
			<FixedFooter><Div style={{ display: 'flex', gap: '10px', padding: '10px' }}>{isEditMode ? <><Button onClick={() => setIsBatterOpen(true)}>타격</Button><Button onClick={() => setIsRunnerOpen(true)}>주자</Button></> : <Button onClick={() => navigate('/league')}>목록</Button>}<Button onClick={() => setIsToolMenuOpen(true)}>도구</Button></Div></FixedFooter>
		</Div>
	);
}
export default LeaguePage