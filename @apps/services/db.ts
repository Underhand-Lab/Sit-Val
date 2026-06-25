import { authRepository } from './db/authRepository';
import { cacheStore } from './db/cache';
import { leagueRepository } from './db/leagueRepository';
import { lineupRepository } from './db/lineupRepository';
import { playerRepository } from './db/playerRepository';

export const db = {
  getSyncCache: cacheStore.get,

  ...authRepository,
  ...leagueRepository,
  ...playerRepository,
  ...lineupRepository,

  async seed() {
    console.log('Seed should be handled via Supabase Dashboard/SQL');
  }
};
