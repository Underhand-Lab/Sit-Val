import { BatterStats } from '@packages/sit-val/types/BatterStats';
import { YearlyPlayer } from '@packages/sit-val/types/Database';
import { RunnerStats } from '@sit-val/types/RunnerStats';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { calculateBasicStats } from '@apps/common/api/baseball';
import { calculateBatterAbility } from '@apps/common/api/stats';
import { calculateLineupRE, LineupCalculationResult } from '@apps/features/lineup/api/re-line-up';
import { db } from '@apps/services/db';
import { BasicStats } from '@apps/types/BasicStats';
import { PageToolOption } from '@apps/pages/types/pageTools';

export interface LineupPlayerDisplay extends YearlyPlayer {
  name: string;
}

interface PendingLineupEdit {
  lineupOrder: string[];
  lineupRunnerStats: RunnerStats;
  lineupName: string;
  selectedYear: number;
}

const INITIAL_RUNNER_STATS: RunnerStats = {
  passedball: 0.03, s_r1_r2_safe: 0.10, s_r1_r2_out: 0.03,
  s_r2_r3_safe: 0.004, s_r2_r3_out: 0.001, '1B_r2_home_safe': 0.40,
  '1B_r2_home_out': 0.05, '1B_r2_r3_safe': 0.55, '1B_r1_r3_safe': 0.30,
  '1B_r1_r3_out': 0.05, '1B_r1_r2_safe': 0.65, '2B_r1_home_safe': 0.7,
  '2B_r1_home_out': 0.05, '2B_r1_r3_safe': 0.25, fo_r3_home_safe: 0.85,
  fo_r3_home_out: 0.05, fo_r3_r3_safe: 0.10, go_r1_r2_out: 0.3, go_b_r1_out: 0.3
};

export type LineupVizData = [LineupCalculationResult, BasicStats] | null;

function createPlaceholderPlayer(pageId: string | undefined, slot: number, year: number): LineupPlayerDisplay {
  return {
    id: `placeholder-${pageId}-${slot}`,
    playerId: `temp-player-${slot}`,
    name: '선수 미지정',
    year,
    yearlyTeamIds: [],
    stats: { '1B': 0, '2B': 0, '3B': 0, hr: 0, bb: 0, so: 0, go: 0, fo: 0, sf: 0, sh: 0, hbp: 0, r: 0, rbi: 0 },
    creatorId: 'unknown',
  };
}

export function useLineupPageModel(id: string | undefined, fromId: string | null, initialTools: PageToolOption[]) {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTools, setActiveTools] = useState<PageToolOption[]>(initialTools);
  const [availablePlayers, setAvailablePlayers] = useState<LineupPlayerDisplay[]>(db.getSyncCache<LineupPlayerDisplay[]>('allYearlyPlayersWithNames') || []);
  const [currentLineupPlayers, setCurrentLineupPlayers] = useState<LineupPlayerDisplay[]>([]);
  const [lineupOrder, setLineupOrder] = useState<string[]>([]);
  const [lineupName, setLineupName] = useState('새 라인업');
  const [selectedYear, setSelectedYear] = useState(2024);
  const [isEditMode, setIsEditMode] = useState(false);
  const [lineupRunnerStats, setLineupRunnerStats] = useState<RunnerStats>(INITIAL_RUNNER_STATS);
  const [isToolMenuOpen, setIsToolMenuOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const targetId = id === 'new' ? fromId : id;
      if (!id) return;

      const cached = targetId ? db.getSyncCache<{ playerIds: string[]; runnerStats: RunnerStats; name: string; year: number }>(`yearlyLineup_${targetId}`) : null;
      if (cached) {
        setLineupOrder(cached.playerIds);
        setLineupRunnerStats(cached.runnerStats);
        setLineupName(cached.name);
        setSelectedYear(cached.year);
        setIsLoading(false);
      } else {
        setIsLoading(true);
      }

      const data = targetId ? await db.getYearlyLineupById(targetId) : null;
      if (data) {
        setLineupOrder(data.playerIds);
        setLineupRunnerStats(data.runnerStats);
        setLineupName(data.name);
        setSelectedYear(data.year);
      }
      setIsEditMode(id === 'new');

      const pending = localStorage.getItem('pending_lineup_edit');
      if (pending) {
        const pendingData = JSON.parse(pending) as PendingLineupEdit;
        setLineupOrder(pendingData.lineupOrder);
        setLineupRunnerStats(pendingData.lineupRunnerStats);
        setLineupName(pendingData.lineupName);
        setSelectedYear(pendingData.selectedYear);
        localStorage.removeItem('pending_lineup_edit');
      }
      setIsLoading(false);
    };

    fetchData();
  }, [fromId, id]);

  useEffect(() => {
    const fetchPlayers = async () => {
      const playersWithStats = await db.getPlayersWithYearlyStats(selectedYear);
      setAvailablePlayers(playersWithStats);
    };

    fetchPlayers();
  }, [selectedYear]);

  const syncedLineupPlayers = useMemo(() => {
    if (isLoading) return [];

    return Array.from({ length: 9 }, (_, index) => {
      const yearlyPlayerId = lineupOrder[index];
      const player = yearlyPlayerId ? availablePlayers.find((candidate) => candidate.id === yearlyPlayerId) : undefined;
      return player || createPlaceholderPlayer(id, index + 1, selectedYear);
    });
  }, [availablePlayers, id, isLoading, lineupOrder, selectedYear]);

  const normalizedLineupOrder = useMemo(() => {
    return syncedLineupPlayers.map((player) => player.id);
  }, [syncedLineupPlayers]);

  useEffect(() => {
    setCurrentLineupPlayers(syncedLineupPlayers);
  }, [syncedLineupPlayers]);

  useEffect(() => {
    if (!isLoading && JSON.stringify(lineupOrder) !== JSON.stringify(normalizedLineupOrder)) {
      setLineupOrder(normalizedLineupOrder);
    }
  }, [isLoading, lineupOrder, normalizedLineupOrder]);

  const vizData = useMemo<LineupVizData>(() => {
    if (normalizedLineupOrder.length !== 9) return null;
    const playerStatsList = normalizedLineupOrder
      .map((playerId) => currentLineupPlayers.find((player) => player.id === playerId)?.stats)
      .filter((stats): stats is YearlyPlayer['stats'] => stats !== undefined);

    if (playerStatsList.length !== 9) return null;

    const abilities = playerStatsList.map((stats) => calculateBatterAbility(new BatterStats(stats)));
    const teamStats = playerStatsList.reduce((acc, stats) => ({
      '1B': acc['1B'] + (stats['1B'] || 0),
      '2B': acc['2B'] + (stats['2B'] || 0),
      '3B': acc['3B'] + (stats['3B'] || 0),
      hr: acc.hr + (stats.hr || 0),
      bb: acc.bb + (stats.bb || 0),
      so: acc.so + (stats.so || 0),
      go: acc.go + (stats.go || 0),
      fo: acc.fo + (stats.fo || 0),
      sf: acc.sf + (stats.sf || 0),
      sh: acc.sh + (stats.sh || 0),
      hbp: acc.hbp + (stats.hbp || 0),
    }), { '1B': 0, '2B': 0, '3B': 0, hr: 0, bb: 0, so: 0, go: 0, fo: 0, sf: 0, sh: 0, hbp: 0 });

    return [calculateLineupRE(abilities, lineupRunnerStats), calculateBasicStats(new BatterStats(teamStats))];
  }, [currentLineupPlayers, lineupRunnerStats, normalizedLineupOrder]);

  const addTool = useCallback((option: PageToolOption) => {
    setActiveTools((prev) => [...prev, option]);
    setIsToolMenuOpen(false);
  }, []);

  return {
    isLoading,
    activeTools,
    setActiveTools,
    vizData,
    availablePlayers,
    setAvailablePlayers,
    currentLineupPlayers,
    setCurrentLineupPlayers,
    lineupOrder,
    setLineupOrder,
    lineupName,
    setLineupName,
    selectedYear,
    setSelectedYear,
    isEditMode,
    lineupRunnerStats,
    setLineupRunnerStats,
    isToolMenuOpen,
    setIsToolMenuOpen,
    addTool,
  };
}
