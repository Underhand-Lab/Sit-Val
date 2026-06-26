import { RunnerStats, YearlyLineup } from '@packages/sit-val/types/Database';
import { supabase } from '../supabaseClient';
import { authRepository } from './authRepository';
import { cacheStore } from './cache';
import { pickRunnerStats } from './mappers';

const DEFAULT_RUNNER_STATS: RunnerStats = {
  passedball: 0.03,
  s_r1_r2_safe: 0.1,
  s_r1_r2_out: 0.03,
  s_r2_r3_safe: 0.004,
  s_r2_r3_out: 0.001,
  '1B_r2_home_safe': 0.4,
  '1B_r2_home_out': 0.05,
  '1B_r2_r3_safe': 0.55,
  '1B_r1_r3_safe': 0.3,
  '1B_r1_r3_out': 0.05,
  '1B_r1_r2_safe': 0.65,
  '2B_r1_home_safe': 0.7,
  '2B_r1_home_out': 0.05,
  '2B_r1_r3_safe': 0.25,
  fo_r3_home_safe: 0.85,
  fo_r3_home_out: 0.05,
  fo_r3_r3_safe: 0.1,
  go_r1_r2_out: 0.3,
  go_b_r1_out: 0.3,
};

const getMergedRunnerStats = (...sources: Array<Record<string, unknown> | null | undefined>): RunnerStats => {
  return sources.reduce(
    (acc, source) => ({ ...acc, ...(source || {}) }),
    { ...DEFAULT_RUNNER_STATS }
  ) as RunnerStats;
};

const getLineupSlots = async (lineupIds: string[]) => {
  if (lineupIds.length === 0) return new Map<string, string[]>();
  const { data, error } = await supabase
    .from('lineup_slots')
    .select('lineup_id, slot_number, player_season_id')
    .in('lineup_id', lineupIds)
    .order('slot_number', { ascending: true });
  if (error) throw error;

  const slotMap = new Map<string, string[]>();
  (data || []).forEach((slot) => {
    const existing = slotMap.get(slot.lineup_id) || [];
    existing[slot.slot_number - 1] = slot.player_season_id;
    slotMap.set(slot.lineup_id, existing);
  });
  return slotMap;
};

const getLeagueSeasonRunnerStatsMap = async (leagueSeasonIds: string[]) => {
  if (leagueSeasonIds.length === 0) return new Map<string, RunnerStats>();
  const { data, error } = await supabase
    .from('league_seasons')
    .select('*')
    .in('id', leagueSeasonIds);
  if (error) throw error;
  return new Map(
    (data || []).map((row) => [row.id, getMergedRunnerStats(pickRunnerStats(row))])
  );
};

const getTeamSeasonContextMap = async (teamSeasonIds: string[]) => {
  if (teamSeasonIds.length === 0) return new Map<string, { runnerStats: RunnerStats }>();
  const { data, error } = await supabase
    .from('team_seasons')
    .select('*')
    .in('id', teamSeasonIds);
  if (error) throw error;

  const leagueRunnerMap = await getLeagueSeasonRunnerStatsMap(
    Array.from(new Set((data || []).map((row) => row.league_season_id).filter(Boolean)))
  );

  return new Map(
    (data || []).map((row) => [
      row.id,
      {
        runnerStats: getMergedRunnerStats(
          leagueRunnerMap.get(row.league_season_id),
          pickRunnerStats(row)
        ),
      },
    ])
  );
};

const mapLineupRow = async (row: any): Promise<YearlyLineup | null> => {
  if (!row) return null;
  const [slotMap, teamContextMap] = await Promise.all([
    getLineupSlots([row.id]),
    getTeamSeasonContextMap([row.team_season_id]),
  ]);

  return {
    id: row.id,
    name: row.name,
    year: row.year,
    playerIds: Array.from({ length: 9 }, (_, index) => slotMap.get(row.id)?.[index] || ''),
    runnerStats: teamContextMap.get(row.team_season_id)?.runnerStats || { ...DEFAULT_RUNNER_STATS },
    creatorId: row.creator_id || '',
    yearlyTeamId: row.team_season_id,
  };
};

const mapLineupRows = async (rows: any[]): Promise<YearlyLineup[]> => {
  const lineupIds = rows.map((row) => row.id);
  const teamSeasonIds = Array.from(new Set(rows.map((row) => row.team_season_id)));
  const [slotMap, teamContextMap] = await Promise.all([
    getLineupSlots(lineupIds),
    getTeamSeasonContextMap(teamSeasonIds),
  ]);

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    year: row.year,
    playerIds: Array.from({ length: 9 }, (_, index) => slotMap.get(row.id)?.[index] || ''),
    runnerStats: teamContextMap.get(row.team_season_id)?.runnerStats || { ...DEFAULT_RUNNER_STATS },
    creatorId: row.creator_id || '',
    yearlyTeamId: row.team_season_id,
  }));
};

const resolveTeamSeasonId = async (lineup: Omit<YearlyLineup, 'creatorId'>, existing?: YearlyLineup | null) => {
  if (existing?.yearlyTeamId) return existing.yearlyTeamId;
  if (lineup.yearlyTeamId) return lineup.yearlyTeamId;

  const firstPlayerId = lineup.playerIds.find(Boolean);
  if (firstPlayerId) {
    const { data: joinRow, error } = await supabase
      .from('player_team_seasons')
      .select('team_season_id')
      .eq('player_season_id', firstPlayerId)
      .maybeSingle();
    if (error) throw error;
    if (joinRow?.team_season_id) return joinRow.team_season_id;
  }

  const { data: fallbackTeamSeason, error } = await supabase
    .from('team_seasons')
    .select('id')
    .eq('year', lineup.year)
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!fallbackTeamSeason?.id) {
    throw new Error('해당 연도에 사용할 team season을 찾을 수 없습니다.');
  }
  return fallbackTeamSeason.id;
};

export const lineupRepository = {
  async saveLineupRunnerStats() {
    return;
  },

  async getLineupRunnerStats(): Promise<RunnerStats | null> {
    return { ...DEFAULT_RUNNER_STATS };
  },

  async getYearlyLineupById(id: string) {
    const { data, error } = await supabase.from('lineups').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    const transformed = await mapLineupRow(data);
    if (transformed) cacheStore.set(`yearlyLineup_${id}`, transformed);
    return transformed;
  },

  async getAllYearlyLineups() {
    const { data, error } = await supabase.from('lineups').select('*');
    if (error) throw error;
    const result = await mapLineupRows(data || []);
    cacheStore.set('allYearlyLineups', result);
    return result;
  },

  async getRecentYearlyLineups(limit = 5) {
    const { data, error } = await supabase
      .from('lineups')
      .select('*')
      .order('year', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return mapLineupRows(data || []);
  },

  async saveYearlyLineup(data: Omit<YearlyLineup, 'creatorId'>) {
    const user = await authRepository.getCurrentUser();
    if (!user) throw new Error('로그인이 필요합니다.');

    const existing = data.id ? await this.getYearlyLineupById(data.id) : null;
    const teamSeasonId = await resolveTeamSeasonId(data, existing);
    const canModify = existing && existing.creatorId === user.id;
    const targetId = canModify ? data.id : `lineup-${Date.now()}`;

    const payload = {
      id: targetId,
      team_season_id: teamSeasonId,
      name: data.name,
      year: data.year,
      creator_id: user.id,
      is_default: false,
    };

    if (canModify) {
      const { error } = await supabase.from('lineups').update(payload).eq('id', targetId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('lineups').insert([payload]);
      if (error) throw error;
    }

    await supabase.from('lineup_slots').delete().eq('lineup_id', targetId);
    const slotRows = data.playerIds
      .slice(0, 9)
      .map((playerSeasonId, index) => ({ playerSeasonId, slotNumber: index + 1 }))
      .filter((slot) => Boolean(slot.playerSeasonId))
      .map((slot) => ({
        id: `${targetId}-slot-${slot.slotNumber}`,
        lineup_id: targetId,
        slot_number: slot.slotNumber,
        player_season_id: slot.playerSeasonId,
      }));

    if (slotRows.length > 0) {
      const { error } = await supabase.from('lineup_slots').insert(slotRows);
      if (error) throw error;
    }

    cacheStore.clear(`yearlyLineup_${targetId}`);
    cacheStore.clear('allYearlyLineups');
    return { mode: canModify ? 'modify' : 'fork', id: targetId } as const;
  },

  async deleteYearlyLineup(id: string) {
    const user = await authRepository.getCurrentUser();
    if (!user) throw new Error('로그인이 필요합니다.');

    const { error } = await supabase.from('lineups').delete().eq('id', id).eq('creator_id', user.id);
    if (error) throw error;
    cacheStore.clear(`yearlyLineup_${id}`);
    cacheStore.clear('allYearlyLineups');
  },
};
