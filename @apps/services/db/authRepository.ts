import { supabase } from '../supabaseClient';
import { cacheStore } from './cache';

export const authRepository = {
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  async updateNickname(nickname: string) {
    const { data, error } = await supabase.auth.updateUser({
      data: { nickname }
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    cacheStore.clearAll();
  },
};
