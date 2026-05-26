import { BatterStatsData } from './BatterStats';
import { RunnerStats } from './RunnerStats'; // RunnerStats import 추가

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
  creatorId: string; // 작성자 ID 추가
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
  creatorId: string; // 작성자 ID 추가
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
  creatorId: string; // 작성자 ID 추가
}

export interface YearlyLineup {
  id: string;
  name: string;
  year: number;
  playerIds: string[]; // YearlyPlayer IDs
  runnerStats: RunnerStats;
  creatorId: string;
}

export interface DBStore {
  leagues: League[];
  yearlyLeagues: YearlyLeague[];
  teams: Team[];
  yearlyTeams: YearlyTeam[];
  players: Player[];
  yearlyPlayers: YearlyPlayer[];
  yearlyLineups: YearlyLineup[];
  lineupRunnerStats: RunnerStats; // 라인업 주자 스탯 추가
}

export type { RunnerStats };