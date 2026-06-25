import * as Calc from '@sit-val/lib/sabermetrics/calc';
import * as TransitionEngine from '@sit-val/lib/transition-engine/';
import { BatterStats, BatterStatsData } from '@sit-val/types/BatterStats';
import { RunnerStats } from '@sit-val/types/RunnerStats';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { calculateBasicStats } from '@apps/common/api/baseball';
import { calculateBatterAbility } from '@apps/common/api/stats';
import { calculateRE, RECalculationResult } from '@apps/features/league/api/re-league';
import { db } from '@apps/services/db';
import { BasicStats } from '@apps/types/BasicStats';
import { YearlyLeague } from '@apps/types/Database';
import { PageToolOption } from '@apps/pages/types/pageTools';

const INITIAL_BATTER_STATS: BatterStatsData = { '1B': 65, '2B': 23, '3B': 0, hr: 56, bb: 111, so: 89, go: 117, fo: 135, sf: 6, sh: 0, hbp: 0 };
const INITIAL_RUNNER_STATS: RunnerStats = { passedball: 0.03, s_r1_r2_safe: 0.10, s_r1_r2_out: 0.03, s_r2_r3_safe: 0.004, s_r2_r3_out: 0.001, '1B_r2_home_safe': 0.40, '1B_r2_home_out': 0.05, '1B_r2_r3_safe': 0.55, '1B_r1_r3_safe': 0.30, '1B_r1_r3_out': 0.05, '1B_r1_r2_safe': 0.65, '2B_r1_home_safe': 0.7, '2B_r1_home_out': 0.05, '2B_r1_r3_safe': 0.25, fo_r3_home_safe: 0.85, fo_r3_home_out: 0.05, fo_r3_r3_safe: 0.10, go_r1_r2_out: 0.3, go_b_r1_out: 0.3 };

interface PendingLeagueEdit {
  leagueIdInput: string;
  selectedYear: number;
  leagueBatterStats: BatterStatsData;
  leagueRunnerStats: RunnerStats;
}

export type LeagueVizData = [RECalculationResult, Calc.WOBAWeights, number, number, number, BasicStats];

export function useLeaguePageModel(id: string | undefined, fromId: string | null, initialTools: PageToolOption[]) {
  const navigate = useNavigate();
  const transitionEngine = useMemo(() => new TransitionEngine.Standard(), []);
  const [yearlyLeagueData, setYearlyLeagueData] = useState<YearlyLeague | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [leagueBatterStats, setLeagueBatterStats] = useState<BatterStatsData>(INITIAL_BATTER_STATS);
  const [leagueRunnerStats, setLeagueRunnerStats] = useState(INITIAL_RUNNER_STATS);
  const [isToolMenuOpen, setIsToolMenuOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [leagueIdInput, setLeagueIdInput] = useState<string>('kbo');
  const [activeTools, setActiveTools] = useState<PageToolOption[]>(initialTools);

  useEffect(() => {
    const fetchData = async () => {
      const targetId = id === 'new' ? fromId : id;
      if (!id) return;

      const cached = targetId ? db.getSyncCache<YearlyLeague>(`yearlyLeague_${targetId}`) : null;
      if (cached) {
        setYearlyLeagueData(cached);
        setLeagueBatterStats(cached.stats);
        setSelectedYear(cached.year);
        setLeagueIdInput(cached.leagueId);
        setIsLoading(false);
      } else {
        setIsLoading(true);
      }

      const data = targetId ? await db.getYearlyLeagueById(targetId) : null;
      if (data) {
        setYearlyLeagueData(data);
        setLeagueBatterStats(data.stats);
        setSelectedYear(data.year);
        setLeagueIdInput(data.leagueId);
      }
      setIsEditMode(id === 'new');

      const pending = localStorage.getItem('pending_league_edit');
      if (pending) {
        const pendingData = JSON.parse(pending) as PendingLeagueEdit;
        setLeagueBatterStats(pendingData.leagueBatterStats);
        setSelectedYear(pendingData.selectedYear);
        setLeagueIdInput(pendingData.leagueIdInput);
        setLeagueRunnerStats(pendingData.leagueRunnerStats);
        localStorage.removeItem('pending_league_edit');
      }
      setIsLoading(false);
    };

    fetchData();
  }, [fromId, id]);

  const addTool = useCallback((option: PageToolOption) => {
    setActiveTools((prev) => [...prev, option]);
    setIsToolMenuOpen(false);
  }, []);

  const vizData = useMemo<LeagueVizData>(() => {
    const batterStats = new BatterStats(leagueBatterStats);
    const ability = calculateBatterAbility(batterStats);
    const basic = calculateBasicStats(batterStats);
    const ret = calculateRE(ability, leagueRunnerStats, transitionEngine);
    const weights = Calc.calculateWeightedRunValue(batterStats, ret.runValue);
    const lgWobaRaw = Calc.calculateCustomWOBA(weights, batterStats);
    return [ret, weights, lgWobaRaw, 0.33 / lgWobaRaw, Calc.calculateLeagueRunPerPA(ret.R[0], batterStats), basic];
  }, [leagueBatterStats, leagueRunnerStats, transitionEngine]);

  const handleSave = useCallback(async () => {
    const user = await db.getCurrentUser();
    if (!user) {
      if (confirm('로그인이 필요한 기능입니다. 현재 내용을 임시 저장하고 로그인 페이지로 이동하시겠습니까?')) {
        const pendingData: PendingLeagueEdit = { leagueIdInput, selectedYear, leagueBatterStats, leagueRunnerStats };
        localStorage.setItem('pending_league_edit', JSON.stringify(pendingData));
        navigate('/login');
      }
      return;
    }

    const actualId = id === 'new' ? (fromId || '') : id || '';
    const leagueData = { id: actualId, leagueId: leagueIdInput, year: selectedYear, stats: { ...leagueBatterStats, r: 0, rbi: 0 } };
    try {
      await db.saveYearlyLeague(leagueData);
      setIsEditMode(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : '저장에 실패했습니다.');
    }
  }, [fromId, id, leagueBatterStats, leagueIdInput, leagueRunnerStats, navigate, selectedYear]);

  return {
    yearlyLeagueData,
    isLoading,
    isEditMode,
    setIsEditMode,
    leagueBatterStats,
    setLeagueBatterStats,
    leagueRunnerStats,
    setLeagueRunnerStats,
    isToolMenuOpen,
    setIsToolMenuOpen,
    selectedYear,
    setSelectedYear,
    leagueIdInput,
    setLeagueIdInput,
    activeTools,
    setActiveTools,
    addTool,
    vizData,
    handleSave,
    isMetaValid: leagueIdInput.trim() !== '' && !isNaN(selectedYear) && selectedYear > 0,
  };
}
