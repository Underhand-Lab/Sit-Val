import { RunnerStats, YearlyLineup } from '@packages/sit-val/types/Database';
import { supabase } from '../supabaseClient';
import { authRepository } from './authRepository';
import { cacheStore } from './cache';
import { flattenRunnerStats, transformRunnerStats } from './mappers';

export const lineupRepository = {
  async saveLineupRunnerStats(stats: RunnerStats) {
    const user = await authRepository.getCurrentUser();
    if (user) {
      await supabase.from('user_settings').upsert({ user_id: user.id, ...flattenRunnerStats({ runnerStats: stats }) });
    }
  },

  async getLineupRunnerStats(): Promise<RunnerStats | null> {
    const user = await authRepository.getCurrentUser();
    if (!user) return null;
    const { data } = await supabase.from('user_settings').select('*').eq('user_id', user.id).maybeSingle();
    return (transformRunnerStats(data) as { runnerStats?: RunnerStats } | null)?.runnerStats || null;
  },

  async getYearlyLineupById(id: string) {
    const { data } = await supabase.from('yearly_lineups').select('*').eq('id', id).maybeSingle();
    const transformed = transformRunnerStats(data);
    if (transformed) cacheStore.set(`yearlyLineup_${id}`, transformed);
    return transformed as YearlyLineup | null;
  },

  async getAllYearlyLineups() {
    const { data, error } = await supabase.from('yearly_lineups').select('*');
    if (error) throw error;
    const result = data.map(transformRunnerStats);
    cacheStore.set('allYearlyLineups', result);
    return result as YearlyLineup[];
  },

  async getRecentYearlyLineups(limit = 5) {
    const { data, error } = await supabase
      .from('yearly_lineups')
      .select('*')
      .order('year', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data.map(transformRunnerStats) as YearlyLineup[];
  },

  async saveYearlyLineup(data: Omit<YearlyLineup, 'creatorId'>) {
    const user = await authRepository.getCurrentUser();
    if (!user) throw new Error('로그인이 필요합니다.');

    const existing = await this.getYearlyLineupById(data.id);
    const flattenedData = flattenRunnerStats(data);

    if (existing && existing.creatorId === user.id) {
      const { error } = await supabase
        .from('yearly_lineups')
        .update({ ...flattenedData, creatorId: user.id })
        .eq('id', data.id);
      if (error) throw error;
      cacheStore.clear(`yearlyLineup_${data.id}`);
      cacheStore.clear('allYearlyLineups');
      return { mode: 'modify', id: data.id } as const;
    }

    const newId = `lineup-${Date.now()}`;
    const { error } = await supabase
      .from('yearly_lineups')
      .insert([{ ...flattenedData, id: newId, creatorId: user.id }]);
    if (error) throw error;
    cacheStore.clear('allYearlyLineups');
    return { mode: 'fork', id: newId } as const;
  },

  async deleteYearlyLineup(id: string) {
    const user = await authRepository.getCurrentUser();
    if (!user) throw new Error('로그인이 필요합니다.');

    const { error } = await supabase.from('yearly_lineups').delete().eq('id', id).eq('creatorId', user.id);
    if (error) throw error;
    cacheStore.clear(`yearlyLineup_${id}`);
    cacheStore.clear('allYearlyLineups');
  },
};
