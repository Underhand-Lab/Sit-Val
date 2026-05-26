import { BatterStatsData } from '../../@packages/sit-val/types/BatterStats';

// 타격 스탯에 득점(R)과 타점(RBI)을 추가한 확장 타입
export interface ExtendedBatterStats extends BatterStatsData {
  r: number;
  rbi: number;
}

export interface League {
  id: string;
  name: string;
}

export interface YearlyLeague {
  id: string;
  leagueId: string;
  year: number;
  stats: ExtendedBatterStats;
}

export interface Team {
  id: string;
  name: string;
}

export interface YearlyTeam {
  id: string;
  teamId: string;
  yearlyLeagueId: string; // 연도별 리그 외래키
  year: number;
  stats: ExtendedBatterStats;
}

export interface Player {
  id: string;
  name: string;
  position?: string;
}

export interface YearlyPlayer {
  id: string;
  playerId: string;
  yearlyTeamIds: string[]; // 이적 고려(여러 팀 가능)
  year: number;
  stats: ExtendedBatterStats;
}

export interface DBStore {
  leagues: League[];
  yearlyLeagues: YearlyLeague[];
  teams: Team[];
  players: Player[];
}