create table leagues (
  id text primary key,
  code text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table league_seasons (
  id text primary key,
  league_id text not null references leagues(id) on delete cascade,
  year integer not null,
  "1B" integer not null default 0,
  "2B" integer not null default 0,
  "3B" integer not null default 0,
  hr integer not null default 0,
  bb integer not null default 0,
  hbp integer not null default 0,
  so integer not null default 0,
  go integer not null default 0,
  fo integer not null default 0,
  sf integer not null default 0,
  sh integer not null default 0,
  r integer not null default 0,
  rbi integer not null default 0,
  passedball double precision,
  s_r1_r2_safe double precision,
  s_r1_r2_out double precision,
  s_r2_r3_safe double precision,
  s_r2_r3_out double precision,
  "1B_r2_home_safe" double precision,
  "1B_r2_home_out" double precision,
  "1B_r2_r3_safe" double precision,
  "1B_r1_r3_safe" double precision,
  "1B_r1_r3_out" double precision,
  "1B_r1_r2_safe" double precision,
  "2B_r1_home_safe" double precision,
  "2B_r1_home_out" double precision,
  "2B_r1_r3_safe" double precision,
  fo_r3_home_safe double precision,
  fo_r3_home_out double precision,
  fo_r3_r3_safe double precision,
  go_r1_r2_out double precision,
  go_b_r1_out double precision,
  creator_id uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  unique (league_id, year)
);

create table teams (
  id text primary key,
  code text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table players (
  id text primary key,
  name text not null,
  bats text,
  throws text,
  position text,
  created_at timestamptz not null default now()
);

create table team_seasons (
  id text primary key,
  team_id text not null references teams(id) on delete cascade,
  league_season_id text not null references league_seasons(id) on delete cascade,
  year integer not null,
  passedball double precision,
  s_r1_r2_safe double precision,
  s_r1_r2_out double precision,
  s_r2_r3_safe double precision,
  s_r2_r3_out double precision,
  "1B_r2_home_safe" double precision,
  "1B_r2_home_out" double precision,
  "1B_r2_r3_safe" double precision,
  "1B_r1_r3_safe" double precision,
  "1B_r1_r3_out" double precision,
  "1B_r1_r2_safe" double precision,
  "2B_r1_home_safe" double precision,
  "2B_r1_home_out" double precision,
  "2B_r1_r3_safe" double precision,
  fo_r3_home_safe double precision,
  fo_r3_home_out double precision,
  fo_r3_r3_safe double precision,
  go_r1_r2_out double precision,
  go_b_r1_out double precision,
  creator_id uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  default_lineup_id text,
  unique (team_id, year)
);

create table player_seasons (
  id text primary key,
  player_id text not null references players(id) on delete cascade,
  league_season_id text not null references league_seasons(id) on delete cascade,
  year integer not null,
  "1B" integer not null default 0,
  "2B" integer not null default 0,
  "3B" integer not null default 0,
  hr integer not null default 0,
  bb integer not null default 0,
  hbp integer not null default 0,
  so integer not null default 0,
  go integer not null default 0,
  fo integer not null default 0,
  sf integer not null default 0,
  sh integer not null default 0,
  r integer not null default 0,
  rbi integer not null default 0,
  creator_id uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  unique (player_id, year)
);

create table player_team_seasons (
  id text primary key,
  player_season_id text not null references player_seasons(id) on delete cascade,
  team_season_id text not null references team_seasons(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (player_season_id, team_season_id)
);

create table lineups (
  id text primary key,
  team_season_id text not null references team_seasons(id) on delete cascade,
  name text not null,
  year integer not null,
  is_default boolean not null default false,
  creator_id uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now()
);

create table lineup_slots (
  id text primary key,
  lineup_id text not null references lineups(id) on delete cascade,
  slot_number integer not null check (slot_number between 1 and 9),
  player_season_id text not null references player_seasons(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (lineup_id, slot_number)
);

alter table team_seasons
  add constraint team_seasons_default_lineup_id_fkey
  foreign key (default_lineup_id) references lineups(id) on delete set null;

create index league_seasons_league_year_idx on league_seasons (league_id, year);
create index team_seasons_team_year_idx on team_seasons (team_id, year);
create index player_seasons_player_year_idx on player_seasons (player_id, year);
create index player_team_seasons_team_idx on player_team_seasons (team_season_id);
create index player_team_seasons_player_idx on player_team_seasons (player_season_id);
create index lineups_team_season_idx on lineups (team_season_id);
create index lineup_slots_lineup_idx on lineup_slots (lineup_id, slot_number);
