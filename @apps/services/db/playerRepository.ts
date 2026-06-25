import { Player, YearlyLeague, YearlyPlayer, YearlyTeam } from '@packages/sit-val/types/Database';
import { supabase } from '../supabaseClient';
import { authRepository } from './authRepository';
import { cacheStore } from './cache';
import { flattenBatterStats, transformBatterStats } from './mappers';

export const playerRepository = {
  async getYearlyPlayerById(id: string) {
    const { data: yearlyPlayer, error } = await supabase
      .from('yearly_players')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!yearlyPlayer) return null;

    const { data: player } = await supabase
      .from('players')
      .select('name')
      .eq('id', yearlyPlayer.playerId)
      .maybeSingle();

    const result = { ...transformBatterStats(yearlyPlayer), name: player?.name || '알 수 없음' };
    cacheStore.set(`yearlyPlayer_${id}`, result);
    return result as YearlyPlayer & { name: string };
  },

  async saveYearlyPlayer(data: Omit<YearlyPlayer, 'creatorId' | 'yearlyLeagueId'> & { name?: string; playerId: string; yearlyLeagueId?: string | null }) {
    const user = await authRepository.getCurrentUser();
    if (!user) throw new Error('로그인이 필요합니다.');

    const { name, ...tableData } = data;
    if (name) {
      await supabase.from('players').upsert({ id: data.playerId, name });
    }

    const flattenedData = flattenBatterStats(tableData);
    const existing = data.id ? await this.getYearlyPlayerById(data.id) : null;

    if (existing && existing.creatorId === user.id) {
      const { error } = await supabase
        .from('yearly_players')
        .update({ ...flattenedData, creatorId: user.id })
        .eq('id', data.id);
      if (error) throw error;
      cacheStore.set(`yearlyPlayer_${data.id}`, { ...data, creatorId: user.id });
      cacheStore.clear('allYearlyPlayersWithNames');
      return { mode: 'modify', id: data.id } as const;
    }

    const newId = `${data.playerId}-${data.year}-${Date.now()}`;
    const { error } = await supabase
      .from('yearly_players')
      .insert([{ ...flattenedData, id: newId, creatorId: user.id }]);
    if (error) throw error;
    cacheStore.set(`yearlyPlayer_${newId}`, { ...data, id: newId, creatorId: user.id });
    cacheStore.clear('allYearlyPlayersWithNames');
    return { mode: 'fork', id: newId } as const;
  },

  async deleteYearlyPlayer(id: string) {
    const user = await authRepository.getCurrentUser();
    if (!user) throw new Error('로그인이 필요합니다.');

    const { error } = await supabase
      .from('yearly_players')
      .delete()
      .eq('id', id)
      .eq('creatorId', user.id);
    if (error) throw error;
    cacheStore.clear(`yearlyPlayer_${id}`);
    cacheStore.clear('allYearlyPlayersWithNames');
  },

  async search(query: string) {
    const q = `%${query}%`;
    const [playersRes, teamsRes, leaguesRes] = await Promise.all([
      supabase.from('players').select('*').ilike('name', q),
      supabase.from('teams').select('*').ilike('name', q),
      supabase.from('yearly_leagues').select('*').or(`leagueId.ilike.${q},year.eq.${parseInt(query, 10) || 0}`)
    ]);

    return {
      players: playersRes.data || [],
      teams: teamsRes.data || [],
      yearlyLeagues: (leaguesRes.data as YearlyLeague[]) || [],
    };
  },

  async getYearlyPlayerData(playerId: string, year: number) {
    const { data: player } = await supabase.from('players').select('*').eq('id', playerId).maybeSingle();
    if (!player) return null;

    const { data: playerStats } = await supabase.from('yearly_players').select('*').eq('playerId', playerId).eq('year', year).maybeSingle();
    if (!playerStats) return null;

    const { data: leagueStats } = await supabase.from('yearly_leagues').select('*').eq('year', year).eq('leagueId', 'kbo').maybeSingle();

    return {
      player: player as Player,
      playerStats: transformBatterStats(playerStats) as YearlyPlayer,
      leagueStats: transformBatterStats(leagueStats) as YearlyLeague,
    };
  },

  async getPlayersWithYearlyStats(year: number) {
    const [yearlyPlayersRes, playersRes] = await Promise.all([
      supabase.from('yearly_players').select('*').eq('year', year),
      supabase.from('players').select('id, name')
    ]);

    if (yearlyPlayersRes.error) throw yearlyPlayersRes.error;
    if (playersRes.error) console.warn('Player names fetch failed:', playersRes.error);

    const players = playersRes.data || [];
    return (yearlyPlayersRes.data || []).map((yearlyPlayer) => ({
      ...yearlyPlayer,
      ...transformBatterStats(yearlyPlayer),
      name: players.find((player) => player.id === yearlyPlayer.playerId)?.name || (yearlyPlayer as any).name || '알 수 없음'
    })) as (YearlyPlayer & { name: string })[];
  },

  async getAllYearlyPlayersWithNames() {
    const [yearlyPlayersRes, playersRes] = await Promise.all([
      supabase.from('yearly_players').select('*'),
      supabase.from('players').select('id, name')
    ]);

    if (yearlyPlayersRes.error) throw yearlyPlayersRes.error;
    if (playersRes.error) console.warn('Player names fetch failed:', playersRes.error);

    const players = playersRes.data || [];
    const result = (yearlyPlayersRes.data || []).map((yearlyPlayer) => ({
      ...yearlyPlayer,
      ...transformBatterStats(yearlyPlayer),
      name: players.find((player) => player.id === yearlyPlayer.playerId)?.name || (yearlyPlayer as any).name || '알 수 없음'
    })) as (YearlyPlayer & { name: string })[];
    cacheStore.set('allYearlyPlayersWithNames', result);
    return result;
  },

  async getRecentYearlyPlayersWithNames(limit = 5) {
    const { data: yearlyPlayers, error: yearlyPlayersError } = await supabase
      .from('yearly_players')
      .select('*')
      .order('year', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit);

    if (yearlyPlayersError) throw yearlyPlayersError;

    const playerIds = (yearlyPlayers || []).map((yearlyPlayer) => yearlyPlayer.playerId);
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('id, name')
      .in('id', playerIds);

    if (playersError) console.warn('Player names fetch failed:', playersError);

    return (yearlyPlayers || []).map((yearlyPlayer) => ({
      ...yearlyPlayer,
      ...transformBatterStats(yearlyPlayer),
      name: (players || []).find((player) => player.id === yearlyPlayer.playerId)?.name || (yearlyPlayer as any).name || '알 수 없음'
    })) as (YearlyPlayer & { name: string })[];
  },

  async getTeamWithPlayers(teamId: string, year: number) {
    const { data: team } = await supabase.from('yearly_teams').select('*').eq('teamId', teamId).eq('year', year).maybeSingle();
    const { data: players } = await supabase.from('yearly_players').select('*').contains('yearlyTeamIds', [team?.id || '']);
    return { team: team as YearlyTeam, players: players as YearlyPlayer[] };
  },

  async getPlayers() {
    const { data } = await supabase.from('players').select('*');
    return data as Player[];
  },

  async addPlayer(player: Player) {
    await supabase.from('players').insert([player]);
  },

  async getYearlyPlayers(year: number) {
    const { data } = await supabase.from('yearly_players').select('*').eq('year', year);
    return data as YearlyPlayer[];
  },
};
