import { League, YearlyLeague } from '@packages/sit-val/types/Database';
import { supabase } from '../supabaseClient';
import { authRepository } from './authRepository';
import { cacheStore } from './cache';
import { flattenBatterStats, pickRunnerStats, transformBatterStats } from './mappers';

const mapLeagueSeasonRow = (row: any): YearlyLeague | null => {
  const transformed = transformBatterStats(row) as any;
  if (!transformed) return null;
  return {
    id: transformed.id,
    leagueId: transformed.league_id,
    year: transformed.year,
    stats: transformed.stats,
    runnerStats: pickRunnerStats(row) as any,
    creatorId: transformed.creator_id || '',
  };
};

export const leagueRepository = {
  getSyncCache: cacheStore.get,

  async getLeagues() {
    const { data, error } = await supabase.from('leagues').select('*');
    if (error) throw error;
    return (data || []).map((league) => ({
      id: league.id,
      code: league.code,
      name: league.name,
    })) as League[];
  },

  async getYearlyLeagues(leagueId: string) {
    const { data, error } = await supabase
      .from('league_seasons')
      .select('*')
      .eq('league_id', leagueId);
    if (error) throw error;
    const result = (data || []).map(mapLeagueSeasonRow).filter(Boolean) as YearlyLeague[];
    cacheStore.set(`yearlyLeagues_${leagueId}`, result);
    return result;
  },

  async getAllYearlyLeagues() {
    const { data, error } = await supabase.from('league_seasons').select('*');
    if (error) throw error;
    const result = (data || []).map(mapLeagueSeasonRow).filter(Boolean) as YearlyLeague[];
    cacheStore.set('allYearlyLeagues', result);
    return result;
  },

  async getRecentYearlyLeagues(limit = 5) {
    const { data, error } = await supabase
      .from('league_seasons')
      .select('*')
      .order('year', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []).map(mapLeagueSeasonRow).filter(Boolean) as YearlyLeague[];
  },

  async getMyYearlyLeagues(limit = 5) {
    const user = await authRepository.getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('league_seasons')
      .select('*')
      .eq('creator_id', user.id)
      .order('year', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []).map(mapLeagueSeasonRow).filter(Boolean) as YearlyLeague[];
  },

  async getYearlyLeagueById(id: string) {
    const { data, error } = await supabase.from('league_seasons').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    const transformed = mapLeagueSeasonRow(data);
    if (transformed) cacheStore.set(`yearlyLeague_${id}`, transformed);
    return transformed;
  },

  async saveYearlyLeague(data: Omit<YearlyLeague, 'creatorId'>) {
    const user = await authRepository.getCurrentUser();
    if (!user) throw new Error('로그인이 필요합니다.');

    const existing = await this.getYearlyLeagueById(data.id);
    const flattenedData = flattenBatterStats(data);
    const payload = {
      ...flattenedData,
      league_id: data.leagueId,
      creator_id: user.id,
      ...(data.runnerStats || {})
    };

    if (existing && existing.creatorId === user.id) {
      const { error } = await supabase
        .from('league_seasons')
        .update(payload)
        .eq('id', data.id);
      if (error) throw error;
      cacheStore.clear(`yearlyLeague_${data.id}`);
      cacheStore.clear(`yearlyLeagues_${data.leagueId}`);
      cacheStore.clear('allYearlyLeagues');
      return { mode: 'modify', id: data.id } as const;
    }

    const newId = `${data.leagueId}-${data.year}-${Date.now()}`;
    const { error } = await supabase
      .from('league_seasons')
      .insert([{ ...payload, id: newId }]);
    if (error) throw error;
    cacheStore.clear(`yearlyLeagues_${data.leagueId}`);
    cacheStore.clear('allYearlyLeagues');
    return { mode: 'fork', id: newId } as const;
  },

  async deleteYearlyLeague(id: string) {
    const user = await authRepository.getCurrentUser();
    if (!user) throw new Error('로그인이 필요합니다.');

    const item = await this.getYearlyLeagueById(id);
    const { error } = await supabase
      .from('league_seasons')
      .delete()
      .eq('id', id)
      .eq('creator_id', user.id);
    if (error) throw error;
    cacheStore.clear(`yearlyLeague_${id}`);
    if (item) cacheStore.clear(`yearlyLeagues_${item.leagueId}`);
    cacheStore.clear('allYearlyLeagues');
  },
};
