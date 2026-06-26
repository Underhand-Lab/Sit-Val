import * as Calc from '@sit-val/lib/sabermetrics/calc';
import * as TransitionEngine from '@sit-val/lib/transition-engine/';
import { BatterStats, BatterStatsData } from '@sit-val/types/BatterStats';
import { RunnerStats } from '@sit-val/types/RunnerStats';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { calculateBatterAbility } from '@apps/common/api/stats';
import { calculateRE } from '@apps/features/league/api/re-league';
import { db } from '@apps/services/db';
import { YearlyLeague, YearlyPlayer } from '@apps/types/Database';
import { PageToolOption } from '@apps/pages/types/pageTools';
import { useNavigate } from 'react-router-dom';
import { openLoginModal } from '@apps/services/authModal';

export const INITIAL_BATTER_STATS: BatterStatsData = { '1B': 0, '2B': 0, '3B': 0, hr: 0, bb: 0, so: 0, go: 0, fo: 0, sf: 0, sh: 0, hbp: 0 };
const INITIAL_RUNNER_STATS: RunnerStats = {
  passedball: 0.03, s_r1_r2_safe: 0.10, s_r1_r2_out: 0.03,
  s_r2_r3_safe: 0.004, s_r2_r3_out: 0.001, '1B_r2_home_safe': 0.40,
  '1B_r2_home_out': 0.05, '1B_r2_r3_safe': 0.55, '1B_r1_r3_safe': 0.30,
  '1B_r1_r3_out': 0.05, '1B_r1_r2_safe': 0.65, '2B_r1_home_safe': 0.7,
  '2B_r1_home_out': 0.05, '2B_r1_r3_safe': 0.25, fo_r3_home_safe: 0.85,
  fo_r3_home_out: 0.05, fo_r3_r3_safe: 0.10, go_r1_r2_out: 0.3, go_b_r1_out: 0.3
};

export type PlayerVizData = [ReturnType<typeof calculateRE>, Calc.WOBAWeights, number, number, number] | null;
type YearlyPlayerWithName = YearlyPlayer & { name?: string };
interface PendingPlayerEdit {
  playerName: string;
  selectedYear: number;
  currentBatterStats: BatterStatsData;
  yearlyLeagueId: string;
}

export function usePlayerPageModel(id: string | undefined, fromId: string | null, initialTools: PageToolOption[]) {
  const navigate = useNavigate();
  const transitionEngine = useMemo(() => new TransitionEngine.Standard(), []);
  const [playerYearlyStats, setPlayerYearlyStats] = useState<YearlyPlayer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [leagueData, setLeagueData] = useState<YearlyLeague | null>(null);
  const [yearlyLeagueId, setYearlyLeagueId] = useState('');
  const [currentBatterStats, setCurrentBatterStats] = useState<BatterStatsData>(INITIAL_BATTER_STATS);
  const [selectedYear, setSelectedYear] = useState(2024);
  const [playerName, setPlayerName] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isToolMenuOpen, setIsToolMenuOpen] = useState(false);
  const [activeTools, setActiveTools] = useState<PageToolOption[]>(initialTools);

  useEffect(() => {
    const fetchData = async () => {
      const targetId = id === 'new' ? fromId : id;
      if (!id) return;

      const cached = targetId ? db.getSyncCache<YearlyPlayerWithName>(`yearlyPlayer_${targetId}`) : null;
      if (cached) {
        setPlayerYearlyStats(cached);
        setCurrentBatterStats(cached.stats || INITIAL_BATTER_STATS);
        setSelectedYear(cached.year);
        setYearlyLeagueId(cached.yearlyLeagueId || '');
        if (cached.name) {
          setPlayerName(cached.name);
          setIsLoading(false);
        }
      } else {
        setIsLoading(true);
      }

      const data = targetId ? await db.getYearlyPlayerById(targetId) : null;
      if (data) {
        setPlayerYearlyStats(data);
        setCurrentBatterStats(data.stats || INITIAL_BATTER_STATS);
        setSelectedYear(data.year);
        setYearlyLeagueId(data.yearlyLeagueId || '');
        setPlayerName(data.name);
        if (data.yearlyLeagueId) {
          const linkedLeague = await db.getYearlyLeagueById(data.yearlyLeagueId);
          setLeagueData(linkedLeague || null);
        }
      } else if (id === 'new') {
        setPlayerName('신규 분석');
      } else {
        setPlayerName('알 수 없음');
      }

      const pending = localStorage.getItem('pending_player_edit');
      if (pending) {
        const pendingData = JSON.parse(pending) as PendingPlayerEdit;
        setPlayerName(pendingData.playerName);
        setSelectedYear(pendingData.selectedYear);
        setCurrentBatterStats(pendingData.currentBatterStats);
        setYearlyLeagueId(pendingData.yearlyLeagueId);
        localStorage.removeItem('pending_player_edit');
      }

      setIsEditMode(id === 'new');
      setIsLoading(false);
    };

    fetchData();
  }, [fromId, id]);

  useEffect(() => {
    const syncLeague = async () => {
      if (!yearlyLeagueId) return;
      const linkedLeague = await db.getYearlyLeagueById(yearlyLeagueId);
      setLeagueData(linkedLeague || null);
    };

    syncLeague();
  }, [yearlyLeagueId]);

  const vizData = useMemo<PlayerVizData>(() => {
    if (!currentBatterStats || !leagueData) return null;
    const stats = new BatterStats(currentBatterStats);
    const ability = calculateBatterAbility(stats);
    const ret = calculateRE(ability, INITIAL_RUNNER_STATS, transitionEngine);
    const lgBatter = new BatterStats(leagueData.stats);
    const weights = Calc.calculateWeightedRunValue(lgBatter, ret.runValue);
    const lgWobaRaw = Calc.calculateCustomWOBA(weights, lgBatter);
    return [ret, weights, lgWobaRaw, 0.33 / lgWobaRaw, Calc.calculateLeagueRunPerPA(ret.R[0], lgBatter)];
  }, [currentBatterStats, leagueData, transitionEngine]);

  const addTool = useCallback((option: PageToolOption) => {
    setActiveTools((prev) => [...prev, option]);
    setIsToolMenuOpen(false);
  }, []);

  const handleSave = useCallback(async () => {
    const user = await db.getCurrentUser();
    if (!user) {
      if (confirm('로그인이 필요한 기능입니다. 현재 내용을 임시 저장하고 로그인 모달을 여시겠습니까?')) {
        const pendingData: PendingPlayerEdit = { playerName, selectedYear, currentBatterStats, yearlyLeagueId };
        localStorage.setItem('pending_player_edit', JSON.stringify(pendingData));
        openLoginModal();
      }
      return;
    }

    const playerIdToUse = playerYearlyStats?.playerId || `player-${Date.now()}`;
    const statsInstance = new BatterStats(currentBatterStats || INITIAL_BATTER_STATS);
    const dataToSave = {
      id: playerYearlyStats?.id || '',
      playerId: playerIdToUse,
      year: selectedYear,
      stats: { ...(currentBatterStats || INITIAL_BATTER_STATS), pa: statsInstance.pa, r: 0, rbi: 0 } as any,
      name: playerName || '',
      yearlyLeagueId: yearlyLeagueId || null,
      yearlyTeamIds: playerYearlyStats?.yearlyTeamIds || ([] as string[])
    };

    const result = await db.saveYearlyPlayer(dataToSave);
    return result.id;
  }, [currentBatterStats, navigate, playerName, playerYearlyStats, selectedYear, yearlyLeagueId]);

  return {
    playerYearlyStats,
    isLoading,
    leagueData,
    yearlyLeagueId,
    setYearlyLeagueId,
    currentBatterStats,
    setCurrentBatterStats,
    selectedYear,
    setSelectedYear,
    playerName,
    setPlayerName,
    isEditMode,
    isToolMenuOpen,
    setIsToolMenuOpen,
    activeTools,
    setActiveTools,
    addTool,
    vizData,
    handleSave,
    isMetaValid: (playerName || '').trim() !== '' && !isNaN(selectedYear) && selectedYear > 0,
  };
}
