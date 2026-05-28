import { League, YearlyLeague, Team, YearlyTeam, Player, YearlyPlayer, ExtendedBatterStats, YearlyLineup, RunnerStats } from '@packages/sit-val/types/Database';
import { supabase } from './supabaseClient';

const CACHE_PREFIX = 'sit_val_cache_';
const memoryCache: Record<string, any> = {};

const _getCache = (key: string) => {
  if (memoryCache[key]) return memoryCache[key];
  const stored = localStorage.getItem(CACHE_PREFIX + key);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      memoryCache[key] = parsed;
      return parsed;
    } catch (e) {
      return null;
    }
  }
  return null;
};

const _setCache = (key: string, data: any) => {
  memoryCache[key] = data;
  localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data));
};

const _clearCache = (key: string) => {
  delete memoryCache[key];
  localStorage.removeItem(CACHE_PREFIX + key);
};

/**
 * Supabase 기반 DB 서비스
 * 모든 읽기 작업은 공개되어 있으며, 쓰기/편집은 RLS(Row Level Security)를 통해 
 * 로그인한 이용자(creatorId가 본인인 경우)만 가능하도록 처리됩니다.
 */
export const db = {
  // 동기적 캐시 접근 (초기 State 설정용)
  getSyncCache: (key: string) => _getCache(key),

  // 인증 시스템 연동
  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  updateNickname: async (nickname: string) => {
    const { data, error } = await supabase.auth.updateUser({
      data: { nickname }
    });
    if (error) throw error;
    return data;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // 리그 관련
  getLeagues: async () => {
    const { data, error } = await supabase.from('leagues').select('*');
    if (error) throw error;
    return data as League[];
  },

  getYearlyLeagues: async (leagueId: string) => {
    const cacheKey = `yearlyLeagues_${leagueId}`;
    const cached = _getCache(cacheKey);
    if (cached) return cached as YearlyLeague[];

    const { data, error } = await supabase
      .from('yearly_leagues')
      .select('*')
      .eq('leagueId', leagueId);
    if (error) throw error;
    _setCache(cacheKey, data);
    return data as YearlyLeague[];
  },
  
  getAllYearlyLeagues: async () => {
    const cached = _getCache('allYearlyLeagues');
    if (cached) return cached as YearlyLeague[];

    const { data, error } = await supabase.from('yearly_leagues').select('*');
    if (error) throw error;
    _setCache('allYearlyLeagues', data);
    return data as YearlyLeague[];
  },

  saveYearlyLeague: async (data: Omit<YearlyLeague, 'creatorId'>) => {
    const user = await db.getCurrentUser();
    if (!user) throw new Error('로그인이 필요합니다.');

    const existing = await db.getYearlyLeagueById(data.id);

    if (existing && existing.creatorId === user.id) {
      const { error } = await supabase
        .from('yearly_leagues')
        .update({ ...data, creatorId: user.id })
        .eq('id', data.id);
      if (error) throw error;
      _clearCache(`yearlyLeagues_${data.leagueId}`);
      _clearCache('allYearlyLeagues');
      return { mode: 'modify', id: data.id };
    } else {
      const newId = `${data.leagueId}-${data.year}-${Date.now()}`;
      const { error } = await supabase
        .from('yearly_leagues')
        .insert([{ ...data, id: newId, creatorId: user.id }]);
      if (error) throw error;
      _clearCache(`yearlyLeagues_${data.leagueId}`);
      _clearCache('allYearlyLeagues');
      return { mode: 'fork', id: newId };
    }
  },

  deleteYearlyLeague: async (id: string) => {
    const user = await db.getCurrentUser();
    if (!user) throw new Error('로그인이 필요합니다.');

    const item = await db.getYearlyLeagueById(id);

    const { error } = await supabase
      .from('yearly_leagues')
      .delete()
      .eq('id', id)
      .eq('creatorId', user.id);
    if (error) throw error;
    if (item) _clearCache(`yearlyLeagues_${item.leagueId}`);
    _clearCache('allYearlyLeagues');
  },

  getYearlyLeagueById: async (id: string) => {
    const { data } = await supabase.from('yearly_leagues').select('*').eq('id', id).maybeSingle();
    return data as YearlyLeague | null;
  },

  getYearlyPlayerById: async (id: string) => {
    const { data } = await supabase.from('yearly_players').select('*').eq('id', id).maybeSingle();
    return data as YearlyPlayer | null;
  },

  saveYearlyPlayer: async (data: Omit<YearlyPlayer, 'creatorId'> & { name?: string }) => {
    const user = await db.getCurrentUser();
    if (!user) throw new Error('로그인이 필요합니다.');

    const { name, ...tableData } = data;

    if (name) {
      await supabase.from('players').upsert({ id: data.playerId, name });
    }

    const existing = await db.getYearlyPlayerById(data.id);

    if (existing && existing.creatorId === user.id) {
      const { error } = await supabase
        .from('yearly_players')
        .update({ ...tableData, creatorId: user.id })
        .eq('id', data.id);
      if (error) throw error;
      _clearCache('allYearlyPlayersWithNames');
      return { mode: 'modify', id: data.id };
    } else {
      const newId = `${data.playerId}-${data.year}-${Date.now()}`;
      const { error } = await supabase
        .from('yearly_players')
        .insert([{ ...tableData, id: newId, creatorId: user.id }]);
      if (error) throw error;
      _clearCache('allYearlyPlayersWithNames');
      return { mode: 'fork', id: newId };
    }
  },

  deleteYearlyPlayer: async (id: string) => {
    const user = await db.getCurrentUser();
    if (!user) throw new Error('로그인이 필요합니다.');

    const { error } = await supabase
      .from('yearly_players')
      .delete()
      .eq('id', id)
      .eq('creatorId', user.id);
    if (error) throw error;
    _clearCache('allYearlyPlayersWithNames');
  },

  saveLineupRunnerStats: async (stats: RunnerStats) => {
    // 사용자별 주자 통계 설정 저장 (사용자 정보가 있을 때만)
    const user = await db.getCurrentUser();
    if (user) {
      await supabase.from('user_settings').upsert({ user_id: user.id, runner_stats: stats });
    }
  },

  getLineupRunnerStats: async (): Promise<RunnerStats | null> => {
    const user = await db.getCurrentUser();
    if (!user) return null;
    const { data } = await supabase.from('user_settings').select('runner_stats').eq('user_id', user.id).maybeSingle();
    return data?.runner_stats || null;
  },

  getYearlyLineupById: async (id: string) => {
    const { data } = await supabase.from('yearly_lineups').select('*').eq('id', id).maybeSingle();
    return data as YearlyLineup | null;
  },

  getAllYearlyLineups: async () => {
    const cached = _getCache('allYearlyLineups');
    if (cached) return cached as YearlyLineup[];

    const { data, error } = await supabase.from('yearly_lineups').select('*');
    if (error) throw error;
    _setCache('allYearlyLineups', data);
    return data as YearlyLineup[];
  },

  saveYearlyLineup: async (data: Omit<YearlyLineup, 'creatorId'>) => {
    const user = await db.getCurrentUser();
    if (!user) throw new Error('로그인이 필요합니다.');
    
    const existing = await db.getYearlyLineupById(data.id);
    if (existing && existing.creatorId === user.id) {
      const { error } = await supabase
        .from('yearly_lineups')
        .update({ ...data, creatorId: user.id })
        .eq('id', data.id);
      if (error) throw error;
      _clearCache('allYearlyLineups');
      return { mode: 'modify', id: data.id };
    }
    
    const newId = `lineup-${Date.now()}`;
    const { error } = await supabase.from('yearly_lineups').insert([{ ...data, id: newId, creatorId: user.id }]);
    if (error) throw error;
    _clearCache('allYearlyLineups');
    return { mode: 'fork', id: newId };
  },

  deleteYearlyLineup: async (id: string) => {
    const user = await db.getCurrentUser();
    if (!user) throw new Error('로그인이 필요합니다.');

    const { error } = await supabase.from('yearly_lineups').delete().eq('id', id).eq('creatorId', user.id);
    if (error) throw error;
    _clearCache('allYearlyLineups');
  },

  search: async (query: string) => {
    const q = `%${query}%`;
    const [playersRes, teamsRes, leaguesRes] = await Promise.all([
      supabase.from('players').select('*').ilike('name', q),
      supabase.from('teams').select('*').ilike('name', q),
      supabase.from('yearly_leagues').select('*').or(`leagueId.ilike.${q},year.eq.${parseInt(query) || 0}`)
    ]);

    const players = playersRes.data || [];
    const teams = teamsRes.data || [];
    const yearlyLeagues = (leaguesRes.data as YearlyLeague[]) || [];

    return { players, teams, yearlyLeagues };
  },

  getYearlyPlayerData: async (playerId: string, year: number) => {
    const { data: player } = await supabase.from('players').select('*').eq('id', playerId).maybeSingle();
    if (!player) return null;

    const { data: playerStats } = await supabase.from('yearly_players').select('*').eq('playerId', playerId).eq('year', year).maybeSingle();
    if (!playerStats) return null;

    const { data: leagueStats } = await supabase.from('yearly_leagues').select('*').eq('year', year).eq('leagueId', 'kbo').maybeSingle();

    return {
      player: player as Player,
      playerStats: playerStats as YearlyPlayer,
      leagueStats: leagueStats as YearlyLeague
    };
  },

  getPlayersWithYearlyStats: async (year: number) => {
    const { data, error } = await supabase
      .from('yearly_players')
      .select('*, players(name)')
      .eq('year', year);

    if (error) throw error;
    return data.map(yp => ({ ...yp, name: (yp.players as any).name })) as (YearlyPlayer & { name: string })[];
  },

  getAllYearlyPlayersWithNames: async () => {
    const cached = _getCache('allYearlyPlayersWithNames');
    if (cached) return cached as (YearlyPlayer & { name: string })[];

    const { data, error } = await supabase
      .from('yearly_players')
      .select('*, players(name)');

    if (error) throw error;
    const result = data.map(yp => ({ ...yp, name: (yp.players as any).name })) as (YearlyPlayer & { name: string })[];
    _setCache('allYearlyPlayersWithNames', result);
    return result;
  },

  getTeamWithPlayers: async (teamId: string, year: number) => {
    const { data: team } = await supabase.from('yearly_teams').select('*').eq('teamId', teamId).eq('year', year).maybeSingle();
    const { data: players } = await supabase.from('yearly_players').select('*').contains('yearlyTeamIds', [team?.id || '']);

    return { team: team as YearlyTeam, players: players as YearlyPlayer[] };
  },

  getPlayers: async () => {
    const { data } = await supabase.from('players').select('*');
    return data as Player[];
  },
  addPlayer: async (player: Player) => {
    await supabase.from('players').insert([player]);
  },
  getYearlyPlayers: async (year: number) => {
    const { data } = await supabase.from('yearly_players').select('*').eq('year', year);
    return data as YearlyPlayer[];
  },
  seed: async () => {
    // Supabase 환경에서는 필요시 SQL Editor나 별도 스크립트로 처리합니다.
    console.log('Seed should be handled via Supabase Dashboard/SQL');
  }
};