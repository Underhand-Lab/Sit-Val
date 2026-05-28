-- 1. 리그 마스터 테이블
CREATE TABLE leagues (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 연도별 리그 통계 테이블
CREATE TABLE yearly_leagues (
  id TEXT PRIMARY KEY,
  "leagueId" TEXT REFERENCES leagues(id),
  year INTEGER NOT NULL,
  stats JSONB NOT NULL,
  "creatorId" UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 선수 마스터 테이블
CREATE TABLE players (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 연도별 선수 통계 테이블
CREATE TABLE yearly_players (
  id TEXT PRIMARY KEY,
  "playerId" TEXT REFERENCES players(id),
  year INTEGER NOT NULL,
  stats JSONB NOT NULL,
  "yearlyTeamIds" TEXT[] DEFAULT '{}',
  "yearlyLeagueId" TEXT REFERENCES yearly_leagues(id),
  "creatorId" UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 팀 마스터 테이블
CREATE TABLE teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 연도별 팀 정보 테이블
CREATE TABLE yearly_teams (
  id TEXT PRIMARY KEY,
  "teamId" TEXT REFERENCES teams(id),
  year INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 연도별 라인업 테이블
CREATE TABLE yearly_lineups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  year INTEGER NOT NULL,
  "playerIds" TEXT[] NOT NULL,
  "runnerStats" JSONB NOT NULL,
  "creatorId" UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. 사용자 설정 테이블 (주자 통계 등)
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  runner_stats JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
