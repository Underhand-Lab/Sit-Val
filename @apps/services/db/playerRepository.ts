import { Player, YearlyLeague, YearlyPlayer, YearlyTeam } from '@packages/sit-val/types/Database';
import { supabase } from '../supabaseClient';
import { authRepository } from './authRepository';
import { cacheStore } from './cache';
import { flattenBatterStats, transformBatterStats } from './mappers';

const mapPlayerSeasonRow = (row: any, playerName?: string, teamIds: string[] = []): (YearlyPlayer & { name: string }) | null => {
  const transformed = transformBatterStats(row) as any;
  if (!transformed) return null;
  return {
    id: transformed.id,
    playerId: transformed.player_id,
    name: playerName || transformed.name || '알 수 없음',
    yearlyTeamIds: teamIds,
    year: transformed.year,
    yearlyLeagueId: transformed.league_season_id,
    stats: transformed.stats,
    creatorId: transformed.creator_id || '',
  };
};

async function getPlayerTeamIds(playerSeasonIds: string[]) {
  if (playerSeasonIds.length === 0) return new Map<string, string[]>();
  const { data, error } = await supabase
    .from('player_team_seasons')
    .select('player_season_id, team_season_id')
    .in('player_season_id', playerSeasonIds);
  if (error) throw error;
  const map = new Map<string, string[]>();
  (data || []).forEach((row) => {
    const existing = map.get(row.player_season_id) || [];
    existing.push(row.team_season_id);
    map.set(row.player_season_id, existing);
  });
  return map;
}

async function getPlayerNames(playerIds: string[]) {
  if (playerIds.length === 0) return new Map<string, string>();
  const { data, error } = await supabase.from('players').select('id, name').in('id', playerIds);
  if (error) throw error;
  return new Map((data || []).map((player) => [player.id, player.name]));
}

export const playerRepository = {
  async getYearlyPlayerById(id: string) {
    const { data: playerSeason, error } = await supabase
      .from('player_seasons')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!playerSeason) return null;

    const [playerNames, teamIdsMap] = await Promise.all([
      getPlayerNames([playerSeason.player_id]),
      getPlayerTeamIds([playerSeason.id]),
    ]);

    const result = mapPlayerSeasonRow(
      playerSeason,
      playerNames.get(playerSeason.player_id),
      teamIdsMap.get(playerSeason.id) || []
    );
    if (result) cacheStore.set(`yearlyPlayer_${id}`, result);
    return result;
  },

  async saveYearlyPlayer(data: Omit<YearlyPlayer, 'creatorId' | 'yearlyLeagueId'> & { name?: string; playerId: string; yearlyLeagueId?: string | null }) {
    const user = await authRepository.getCurrentUser();
    if (!user) throw new Error('로그인이 필요합니다.');

    const { name, yearlyTeamIds = [], ...tableData } = data as any;
    if (name) {
      await supabase.from('players').upsert({ id: data.playerId, name });
    }

    const flattenedData = flattenBatterStats(tableData);
    const existing = data.id ? await this.getYearlyPlayerById(data.id) : null;

    const payload = {
      ...flattenedData,
      player_id: data.playerId,
      league_season_id: data.yearlyLeagueId || null,
      creator_id: user.id,
    };

    const targetId = existing && existing.creatorId === user.id ? data.id : `${data.playerId}-${data.year}-${Date.now()}`;
    if (existing && existing.creatorId === user.id) {
      const { error } = await supabase.from('player_seasons').update(payload).eq('id', data.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('player_seasons').insert([{ ...payload, id: targetId }]);
      if (error) throw error;
    }

    await supabase.from('player_team_seasons').delete().eq('player_season_id', targetId);
    if (yearlyTeamIds.length > 0) {
      const rows = yearlyTeamIds.map((teamSeasonId: string, index: number) => ({
        id: `${targetId}-${index}`,
        player_season_id: targetId,
        team_season_id: teamSeasonId,
      }));
      const { error } = await supabase.from('player_team_seasons').insert(rows);
      if (error) throw error;
    }

    cacheStore.clear(`yearlyPlayer_${targetId}`);
    cacheStore.clear('allYearlyPlayersWithNames');
    return { mode: existing && existing.creatorId === user.id ? 'modify' : 'fork', id: targetId } as const;
  },

  async deleteYearlyPlayer(id: string) {
    const user = await authRepository.getCurrentUser();
    if (!user) throw new Error('로그인이 필요합니다.');

    const { error } = await supabase
      .from('player_seasons')
      .delete()
      .eq('id', id)
      .eq('creator_id', user.id);
    if (error) throw error;
    cacheStore.clear(`yearlyPlayer_${id}`);
    cacheStore.clear('allYearlyPlayersWithNames');
  },

  async search(query: string) {
    const q = `%${query}%`;
    const numericYear = parseInt(query, 10);
    const [playersRes, teamsRes, leaguesRes] = await Promise.all([
      supabase.from('players').select('*').ilike('name', q),
      supabase.from('teams').select('*').ilike('name', q),
      supabase.from('league_seasons').select('*').or(`league_id.ilike.${q},year.eq.${numericYear || 0}`)
    ]);

    return {
      players: playersRes.data || [],
      teams: teamsRes.data || [],
      yearlyLeagues: ((leaguesRes.data || []).map((row: any) => ({
        id: row.id,
        leagueId: row.league_id,
        year: row.year,
        stats: transformBatterStats(row)?.stats,
        creatorId: row.creator_id || '',
      })) as YearlyLeague[]) || [],
    };
  },

  async getYearlyPlayerData(playerId: string, year: number) {
    const { data: player } = await supabase.from('players').select('*').eq('id', playerId).maybeSingle();
    if (!player) return null;

    const { data: playerStats } = await supabase.from('player_seasons').select('*').eq('player_id', playerId).eq('year', year).maybeSingle();
    if (!playerStats) return null;

    const { data: leagueStats } = await supabase.from('league_seasons').select('*').eq('year', year).eq('league_id', 'league-kbo').maybeSingle();

    return {
      player: player as Player,
      playerStats: mapPlayerSeasonRow(playerStats, player.name) as YearlyPlayer,
      leagueStats: leagueStats ? ({
        id: leagueStats.id,
        leagueId: leagueStats.league_id,
        year: leagueStats.year,
        stats: transformBatterStats(leagueStats)?.stats,
        runnerStats: undefined,
        creatorId: leagueStats.creator_id || '',
      } as YearlyLeague) : null,
    };
  },

  async getPlayersWithYearlyStats(year: number) {
    const { data: playerSeasons, error } = await supabase.from('player_seasons').select('*').eq('year', year);
    if (error) throw error;
    const seasons = playerSeasons || [];
    const [playerNames, teamIdsMap] = await Promise.all([
      getPlayerNames(seasons.map((row) => row.player_id)),
      getPlayerTeamIds(seasons.map((row) => row.id)),
    ]);
    return seasons
      .map((row) => mapPlayerSeasonRow(row, playerNames.get(row.player_id), teamIdsMap.get(row.id) || []))
      .filter(Boolean) as (YearlyPlayer & { name: string })[];
  },

  async getAllYearlyPlayersWithNames() {
    const { data: playerSeasons, error } = await supabase.from('player_seasons').select('*');
    if (error) throw error;
    const seasons = playerSeasons || [];
    const [playerNames, teamIdsMap] = await Promise.all([
      getPlayerNames(seasons.map((row) => row.player_id)),
      getPlayerTeamIds(seasons.map((row) => row.id)),
    ]);
    const result = seasons
      .map((row) => mapPlayerSeasonRow(row, playerNames.get(row.player_id), teamIdsMap.get(row.id) || []))
      .filter(Boolean) as (YearlyPlayer & { name: string })[];
    cacheStore.set('allYearlyPlayersWithNames', result);
    return result;
  },

  async getRecentYearlyPlayersWithNames(limit = 5) {
    const { data: playerSeasons, error } = await supabase
      .from('player_seasons')
      .select('*')
      .order('year', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit);
    if (error) throw error;
    const seasons = playerSeasons || [];
    const [playerNames, teamIdsMap] = await Promise.all([
      getPlayerNames(seasons.map((row) => row.player_id)),
      getPlayerTeamIds(seasons.map((row) => row.id)),
    ]);
    return seasons
      .map((row) => mapPlayerSeasonRow(row, playerNames.get(row.player_id), teamIdsMap.get(row.id) || []))
      .filter(Boolean) as (YearlyPlayer & { name: string })[];
  },

  async getTeamWithPlayers(teamId: string, year: number) {
    const { data: teamSeason } = await supabase.from('team_seasons').select('*').eq('team_id', teamId).eq('year', year).maybeSingle();
    if (!teamSeason) return { team: null, players: [] };
    const { data: joins } = await supabase.from('player_team_seasons').select('player_season_id').eq('team_season_id', teamSeason.id);
    const playerSeasonIds = (joins || []).map((join) => join.player_season_id);
    const { data: playerSeasons } = await supabase.from('player_seasons').select('*').in('id', playerSeasonIds);
    const names = await getPlayerNames((playerSeasons || []).map((row) => row.player_id));
    return {
      team: {
        id: teamSeason.id,
        teamId: teamSeason.team_id,
        yearlyLeagueId: teamSeason.league_season_id,
        year: teamSeason.year,
        runnerStats: undefined,
        creatorId: teamSeason.creator_id || '',
        defaultLineupId: teamSeason.default_lineup_id || null,
      } as YearlyTeam,
      players: (playerSeasons || []).map((row) => mapPlayerSeasonRow(row, names.get(row.player_id), [teamSeason.id])).filter(Boolean) as YearlyPlayer[],
    };
  },

  async getPlayers() {
    const { data } = await supabase.from('players').select('*');
    return (data || []).map((player) => ({
      id: player.id,
      name: player.name,
      position: player.position,
      bats: player.bats,
      throws: player.throws,
    })) as Player[];
  },

  async addPlayer(player: Player) {
    await supabase.from('players').insert([player]);
  },

  async getYearlyPlayers(year: number) {
    const result = await this.getPlayersWithYearlyStats(year);
    return result as YearlyPlayer[];
  },
};
