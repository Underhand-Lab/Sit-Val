import { BatterStatsData } from './BatterStats';
import { RunnerStats } from './RunnerStats';

export interface ExtendedBatterStats extends BatterStatsData {
  r: number;
  rbi: number;
}

export interface League {
  id: string;
  code?: string;
  name: string;
}

export interface YearlyLeague {
  id: string;
  leagueId: string;
  year: number;
  stats: ExtendedBatterStats;
  runnerStats?: RunnerStats;
  creatorId: string;
}

export interface Team {
  id: string;
  code?: string;
  name: string;
}

export interface YearlyTeam {
  id: string;
  teamId: string;
  yearlyLeagueId: string;
  year: number;
  runnerStats?: RunnerStats | null;
  defaultLineupId?: string | null;
  creatorId: string;
}

export interface Player {
  id: string;
  name: string;
  position?: string;
  bats?: string;
  throws?: string;
}

export interface YearlyPlayer {
  id: string;
  playerId: string;
  name?: string;
  yearlyTeamIds: string[];
  year: number;
  yearlyLeagueId?: string;
  stats: ExtendedBatterStats;
  creatorId: string;
}

export interface YearlyLineup {
  id: string;
  name: string;
  year: number;
  playerIds: string[];
  runnerStats: RunnerStats;
  creatorId: string;
  yearlyTeamId?: string;
}

export interface DBStore {
  leagues: League[];
  yearlyLeagues: YearlyLeague[];
  teams: Team[];
  yearlyTeams: YearlyTeam[];
  players: Player[];
  yearlyPlayers: YearlyPlayer[];
  yearlyLineups: YearlyLineup[];
  lineupRunnerStats: RunnerStats;
}

export type { RunnerStats };
