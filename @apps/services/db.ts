import { League, YearlyLeague, Team, YearlyTeam, Player, YearlyPlayer, ExtendedBatterStats, YearlyLineup, RunnerStats } from '@packages/sit-val/types/Database';

const STORAGE_KEY = 'sit_val_db';

/**
 * LocalStorage를 기반으로 한 간이 DB 서비스
 * 향후 Supabase/Firebase로 교체 가능하도록 Repository 패턴으로 확장 가능
 */
export const db = {
  saveData: (key: string, data: any) => {
    const currentDb = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    currentDb[key] = data;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentDb));
  },

  getData: (key: string): any[] => {
    const currentDb = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return currentDb[key] || [];
  },

  // Mock 인증 시스템 (테스트용)
  getCurrentUser: () => {
    // 실제 구현 시에는 Firebase Auth나 Supabase Auth 연동
    return { id: 'user_123', name: '테스트 사용자' };
  },

  // 리그 관련
  getLeagues: () => db.getData('leagues') as League[],
  getYearlyLeagues: (leagueId: string) => 
    (db.getData('yearlyLeagues') as YearlyLeague[]).filter(yl => yl.leagueId === leagueId),
  
  // 저장 또는 업데이트 (소유권 확인)
  saveYearlyLeague: (data: Omit<YearlyLeague, 'creatorId'>) => {
    const user = db.getCurrentUser();
    if (!user) throw new Error('로그인이 필요합니다.');

    const list = db.getData('yearlyLeagues') as YearlyLeague[];
    const existingIndex = list.findIndex(l => l.id === data.id);

    if (existingIndex !== -1 && list[existingIndex].creatorId === user.id) {
      // 내 데이터면 수정 (Modify)
      list[existingIndex] = { ...data, creatorId: user.id };
      db.saveData('yearlyLeagues', list);
      return { mode: 'modify', id: data.id };
    } else {
      // 타인 데이터거나 새 데이터면 포크/신규 저장 (Fork)
      const newId = `${data.leagueId}-${data.year}-${Date.now()}`;
      const newList = [...list, { ...data, id: newId, creatorId: user.id }];
      db.saveData('yearlyLeagues', newList);
      return { mode: 'fork', id: newId };
    }
  },
  getYearlyLeagueById: (id: string) => {
    const list = db.getData('yearlyLeagues') as YearlyLeague[];
    return list.find(yl => yl.id === id);
  },

  getYearlyPlayerById: (id: string) => {
    const list = db.getData('yearlyPlayers') as YearlyPlayer[];
    return list.find(p => p.id === id);
  },

  // 저장 또는 업데이트 (소유권 확인)
  saveYearlyPlayer: (data: Omit<YearlyPlayer, 'creatorId'>) => {
    const user = db.getCurrentUser();
    if (!user) throw new Error('로그인이 필요합니다.');

    const list = db.getData('yearlyPlayers') as YearlyPlayer[];
    const existingIndex = list.findIndex(p => p.id === data.id);

    if (existingIndex !== -1 && list[existingIndex].creatorId === user.id) {
      // 내 데이터면 수정 (Modify)
      list[existingIndex] = { ...data, creatorId: user.id };
      db.saveData('yearlyPlayers', list);
      return { mode: 'modify', id: data.id };
    } else {
      // 타인 데이터거나 새 데이터면 포크/신규 저장 (Fork)
      const newId = `${data.playerId}-${data.year}-${Date.now()}`;
      const newList = [...list, { ...data, id: newId, creatorId: user.id }];
      db.saveData('yearlyPlayers', newList);
      return { mode: 'fork', id: newId };
    }
  },

  // 라인업 주자 설정 관련
  saveLineupRunnerStats: (stats: RunnerStats) => {
    db.saveData('lineupRunnerStats', [stats]);
  },

  getLineupRunnerStats: (): RunnerStats | null => {
    const list = db.getData('lineupRunnerStats') as RunnerStats[];
    return list.length > 0 ? list[0] : null;
  },

  getYearlyLineupById: (id: string) => {
    const list = db.getData('yearlyLineups') as YearlyLineup[];
    return list.find(l => l.id === id);
  },

  saveYearlyLineup: (data: Omit<YearlyLineup, 'creatorId'>) => {
    const user = db.getCurrentUser();
    if (!user) throw new Error('로그인이 필요합니다.');
    const list = db.getData('yearlyLineups') as YearlyLineup[];
    const existingIndex = list.findIndex(l => l.id === data.id);
    if (existingIndex !== -1 && list[existingIndex].creatorId === user.id) {
      list[existingIndex] = { ...data, creatorId: user.id };
      db.saveData('yearlyLineups', list);
      return { mode: 'modify', id: data.id };
    }
    const newId = `lineup-${Date.now()}`;
    db.saveData('yearlyLineups', [...list, { ...data, id: newId, creatorId: user.id }]);
    return { mode: 'fork', id: newId };
  },

  // 통합 검색 기능
  search: (query: string) => {
    const q = query.toLowerCase();
    const players = (db.getData('players') as Player[]).filter(p => p.name.toLowerCase().includes(q));
    // Note: yearlyPlayers are not directly searchable by name here, but by their associated player's name.
    // If direct search on yearlyPlayers is needed, it would require joining or pre-processing.
    // For now, search returns base Player objects.

    const teams = (db.getData('teams') as Team[]).filter(t => t.name.toLowerCase().includes(q));
    const yearlyLeagues = (db.getData('yearlyLeagues') as YearlyLeague[]).filter(yl => 
      yl.year.toString().includes(q) || yl.leagueId.toLowerCase().includes(q)
    );

    return { players, teams, yearlyLeagues };
  },

  // 특정 선수의 특정 연도 기록 및 해당 리그 기록 조회 (PersonalVisualizer용)
  getYearlyPlayerData: (playerId: string, year: number) => {
    const players = db.getData('players') as Player[];
    const player = players.find(p => p.id === playerId);
    if (!player) return null;

    const yearlyPlayers = db.getData('yearlyPlayers') as YearlyPlayer[];
    const playerStats = yearlyPlayers.find(p => p.playerId === playerId && p.year === year);
    
    if (!playerStats) return null;

    // 해당 선수가 속한 팀의 리그 정보를 찾아 리그 평균 스탯 가져오기
    const yearlyLeagues = db.getData('yearlyLeagues') as YearlyLeague[];
    const leagueStats = yearlyLeagues.find(l => l.year === year && l.leagueId === 'kbo'); // Assuming KBO for now

    return {
      player, // Add player object
      playerStats,
      leagueStats
    };
  },

  // 특정 연도의 모든 선수 기록과 기본 정보 조회
  getPlayersWithYearlyStats: (year: number) => {
    const allPlayers = db.getData('players') as Player[];
    const allYearlyPlayers = db.getData('yearlyPlayers') as YearlyPlayer[];

    return allYearlyPlayers
      .filter(yp => yp.year === year)
      .map(yp => {
        const playerInfo = allPlayers.find(p => p.id === yp.playerId);
        return playerInfo ? { ...yp, name: playerInfo.name } : null;
      })
      .filter(Boolean) as (YearlyPlayer & { name: string })[];
  },

  // 팀 정보 및 소속 선수 목록 조회
  getTeamWithPlayers: (teamId: string, year: number) => {
    const yearlyTeams = db.getData('yearlyTeams') as YearlyTeam[];
    const team = yearlyTeams.find(t => t.teamId === teamId && t.year === year);
    
    const yearlyPlayers = db.getData('yearlyPlayers') as YearlyPlayer[];
    const players = yearlyPlayers.filter(p => p.yearlyTeamIds.includes(team?.id || ''));

    return { team, players };
  },

  // 선수 관련
  getPlayers: () => db.getData('players') as Player[],
  addPlayer: (player: Player) => {
    const list = db.getData('players');
    db.saveData('players', [...list, player]);
  },

  // 특정 연도/리그의 선수 통계 조회
  getYearlyPlayers: (year: number) => {
    const yearlyPlayers = db.getData('yearlyPlayers') as YearlyPlayer[];
    return yearlyPlayers.filter(p => p.year === year);
  },

  /**
   * 초기 Mock 데이터 주입 (테스트용)
   */
  seed: () => {
    if (db.getLeagues().length === 0) {
      db.saveData('leagues', [{ id: 'kbo', name: 'KBO 리그' }]);
      console.log('Seed data initialized');
    }
  }
};

// 앱 시작 시 시드 데이터 로드
db.seed();