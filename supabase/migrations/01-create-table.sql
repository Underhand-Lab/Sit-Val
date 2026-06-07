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
  "1B" INTEGER DEFAULT 0,
  "2B" INTEGER DEFAULT 0,
  "3B" INTEGER DEFAULT 0,
  hr INTEGER DEFAULT 0,
  bb INTEGER DEFAULT 0,
  hbp INTEGER DEFAULT 0,
  so INTEGER DEFAULT 0,
  go INTEGER DEFAULT 0,
  fo INTEGER DEFAULT 0,
  sf INTEGER DEFAULT 0,
  sh INTEGER DEFAULT 0,
  r INTEGER DEFAULT 0,
  rbi INTEGER DEFAULT 0,
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
  "1B" INTEGER DEFAULT 0,
  "2B" INTEGER DEFAULT 0,
  "3B" INTEGER DEFAULT 0,
  hr INTEGER DEFAULT 0,
  bb INTEGER DEFAULT 0,
  hbp INTEGER DEFAULT 0,
  so INTEGER DEFAULT 0,
  go INTEGER DEFAULT 0,
  fo INTEGER DEFAULT 0,
  sf INTEGER DEFAULT 0,
  sh INTEGER DEFAULT 0,
  r INTEGER DEFAULT 0,
  rbi INTEGER DEFAULT 0,
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
  passedball FLOAT DEFAULT 0,
  s_r1_r2_safe FLOAT DEFAULT 0,
  s_r1_r2_out FLOAT DEFAULT 0,
  s_r2_r3_safe FLOAT DEFAULT 0,
  s_r2_r3_out FLOAT DEFAULT 0,
  "1B_r2_home_safe" FLOAT DEFAULT 0,
  "1B_r2_home_out" FLOAT DEFAULT 0,
  "1B_r2_r3_safe" FLOAT DEFAULT 0,
  "1B_r1_r3_safe" FLOAT DEFAULT 0,
  "1B_r1_r3_out" FLOAT DEFAULT 0,
  "1B_r1_r2_safe" FLOAT DEFAULT 0,
  "2B_r1_home_safe" FLOAT DEFAULT 0,
  "2B_r1_home_out" FLOAT DEFAULT 0,
  "2B_r1_r3_safe" FLOAT DEFAULT 0,
  fo_r3_home_safe FLOAT DEFAULT 0,
  fo_r3_home_out FLOAT DEFAULT 0,
  fo_r3_r3_safe FLOAT DEFAULT 0,
  go_r1_r2_out FLOAT DEFAULT 0,
  go_b_r1_out FLOAT DEFAULT 0,
  "creatorId" UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. 사용자 설정 테이블 (주자 통계 등)
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  passedball FLOAT DEFAULT 0,
  s_r1_r2_safe FLOAT DEFAULT 0,
  s_r1_r2_out FLOAT DEFAULT 0,
  s_r2_r3_safe FLOAT DEFAULT 0,
  s_r2_r3_out FLOAT DEFAULT 0,
  "1B_r2_home_safe" FLOAT DEFAULT 0,
  "1B_r2_home_out" FLOAT DEFAULT 0,
  "1B_r2_r3_safe" FLOAT DEFAULT 0,
  "1B_r1_r3_safe" FLOAT DEFAULT 0,
  "1B_r1_r3_out" FLOAT DEFAULT 0,
  "1B_r1_r2_safe" FLOAT DEFAULT 0,
  "2B_r1_home_safe" FLOAT DEFAULT 0,
  "2B_r1_home_out" FLOAT DEFAULT 0,
  "2B_r1_r3_safe" FLOAT DEFAULT 0,
  fo_r3_home_safe FLOAT DEFAULT 0,
  fo_r3_home_out FLOAT DEFAULT 0,
  fo_r3_r3_safe FLOAT DEFAULT 0,
  go_r1_r2_out FLOAT DEFAULT 0,
  go_b_r1_out FLOAT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
