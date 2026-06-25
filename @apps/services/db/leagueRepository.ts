import { League, YearlyLeague } from '@packages/sit-val/types/Database';
import { supabase } from '../supabaseClient';
import { authRepository } from './authRepository';
import { cacheStore } from './cache';
import { flattenBatterStats, transformBatterStats } from './mappers';

export const leagueRepository = {
  getSyncCache: cacheStore.get,

  async getLeagues() {
    const { data, error } = await supabase.from('leagues').select('*');
    if (error) throw error;
    return data as League[];
  },

  async getYearlyLeagues(leagueId: string) {
    const { data, error } = await supabase
      .from('yearly_leagues')
      .select('*')
      .eq('leagueId', leagueId);
    if (error) throw error;
    const result = data.map(transformBatterStats);
    cacheStore.set(`yearlyLeagues_${leagueId}`, result);
    return result as YearlyLeague[];
  },

  async getAllYearlyLeagues() {
    const { data, error } = await supabase.from('yearly_leagues').select('*');
    if (error) throw error;
    const result = data.map(transformBatterStats);
    cacheStore.set('allYearlyLeagues', result);
    return result as YearlyLeague[];
  },

  async getRecentYearlyLeagues(limit = 5) {
    const { data, error } = await supabase
      .from('yearly_leagues')
      .select('*')
      .order('year', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data.map(transformBatterStats) as YearlyLeague[];
  },

  async getYearlyLeagueById(id: string) {
    const { data } = await supabase.from('yearly_leagues').select('*').eq('id', id).maybeSingle();
    const transformed = transformBatterStats(data);
    if (transformed) cacheStore.set(`yearlyLeague_${id}`, transformed);
    return transformed as YearlyLeague | null;
  },

  async saveYearlyLeague(data: Omit<YearlyLeague, 'creatorId'>) {
    const user = await authRepository.getCurrentUser();
    if (!user) throw new Error('로그인이 필요합니다.');

    const existing = await this.getYearlyLeagueById(data.id);
    const flattenedData = flattenBatterStats(data);

    if (existing && existing.creatorId === user.id) {
      const { error } = await supabase
        .from('yearly_leagues')
        .update({ ...flattenedData, creatorId: user.id })
        .eq('id', data.id);
      if (error) throw error;
      cacheStore.clear(`yearlyLeague_${data.id}`);
      cacheStore.clear(`yearlyLeagues_${data.leagueId}`);
      cacheStore.clear('allYearlyLeagues');
      return { mode: 'modify', id: data.id } as const;
    }

    const newId = `${data.leagueId}-${data.year}-${Date.now()}`;
    const { error } = await supabase
      .from('yearly_leagues')
      .insert([{ ...flattenedData, id: newId, creatorId: user.id }]);
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
      .from('yearly_leagues')
      .delete()
      .eq('id', id)
      .eq('creatorId', user.id);
    if (error) throw error;
    cacheStore.clear(`yearlyLeague_${id}`);
    if (item) cacheStore.clear(`yearlyLeagues_${item.leagueId}`);
    cacheStore.clear('allYearlyLeagues');
  },
};
