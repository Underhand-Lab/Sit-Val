insert into leagues (id, code, name)
values ('league-kbo', 'kbo', 'KBO 리그');

insert into league_seasons (
  id,
  league_id,
  year,
  "1B",
  "2B",
  "3B",
  hr,
  bb,
  hbp,
  so,
  go,
  fo,
  sf,
  sh,
  r,
  rbi,
  passedball,
  s_r1_r2_safe,
  s_r1_r2_out,
  s_r2_r3_safe,
  s_r2_r3_out,
  "1B_r2_home_safe",
  "1B_r2_home_out",
  "1B_r2_r3_safe",
  "1B_r1_r3_safe",
  "1B_r1_r3_out",
  "1B_r1_r2_safe",
  "2B_r1_home_safe",
  "2B_r1_home_out",
  "2B_r1_r3_safe",
  fo_r3_home_safe,
  fo_r3_home_out,
  fo_r3_r3_safe,
  go_r1_r2_out,
  go_b_r1_out
)
values (
  'league-season-kbo-2024',
  'league-kbo',
  2024,
  65,
  23,
  0,
  56,
  111,
  0,
  89,
  117,
  135,
  6,
  0,
  0,
  0,
  0.03,
  0.10,
  0.03,
  0.004,
  0.001,
  0.40,
  0.05,
  0.55,
  0.30,
  0.05,
  0.65,
  0.70,
  0.05,
  0.25,
  0.85,
  0.05,
  0.10,
  0.30,
  0.30
);

insert into teams (id, code, name)
values
  ('team-lg', 'lg', 'LG 트윈스'),
  ('team-kt', 'kt', 'KT 위즈');

insert into players (id, name, bats, throws, position)
values
  ('player-hong', '홍길동', 'R', 'R', 'OF'),
  ('player-kim', '김민수', 'L', 'R', '1B'),
  ('player-park', '박준호', 'R', 'R', '2B'),
  ('player-lee', '이도윤', 'L', 'L', 'CF'),
  ('player-choi', '최현우', 'R', 'R', '3B'),
  ('player-jung', '정시우', 'R', 'R', 'SS'),
  ('player-yoon', '윤태성', 'L', 'R', 'C'),
  ('player-han', '한지혁', 'R', 'R', 'LF'),
  ('player-shin', '신우진', 'L', 'L', 'DH');

insert into team_seasons (
  id,
  team_id,
  league_season_id,
  year,
  passedball,
  s_r1_r2_safe,
  s_r1_r2_out,
  s_r2_r3_safe,
  s_r2_r3_out,
  "1B_r2_home_safe",
  "1B_r2_home_out",
  "1B_r2_r3_safe",
  "1B_r1_r3_safe",
  "1B_r1_r3_out",
  "1B_r1_r2_safe",
  "2B_r1_home_safe",
  "2B_r1_home_out",
  "2B_r1_r3_safe",
  fo_r3_home_safe,
  fo_r3_home_out,
  fo_r3_r3_safe,
  go_r1_r2_out,
  go_b_r1_out
)
values
  (
    'team-season-lg-2024',
    'team-lg',
    'league-season-kbo-2024',
    2024,
    0.03,
    0.10,
    0.03,
    0.004,
    0.001,
    0.40,
    0.05,
    0.55,
    0.30,
    0.05,
    0.65,
    0.70,
    0.05,
    0.25,
    0.85,
    0.05,
    0.10,
    0.30,
    0.30
  ),
  (
    'team-season-kt-2024',
    'team-kt',
    'league-season-kbo-2024',
    2024,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null
  );

insert into player_seasons (
  id,
  player_id,
  league_season_id,
  year,
  "1B",
  "2B",
  "3B",
  hr,
  bb,
  hbp,
  so,
  go,
  fo,
  sf,
  sh,
  r,
  rbi
)
values
  ('player-season-hong-2024', 'player-hong', 'league-season-kbo-2024', 2024, 92, 21, 3, 14, 48, 2, 78, 110, 96, 5, 1, 0, 0),
  ('player-season-kim-2024', 'player-kim', 'league-season-kbo-2024', 2024, 74, 18, 1, 22, 55, 4, 102, 88, 104, 4, 0, 0, 0),
  ('player-season-park-2024', 'player-park', 'league-season-kbo-2024', 2024, 81, 27, 2, 9, 39, 1, 69, 121, 90, 6, 3, 0, 0),
  ('player-season-lee-2024', 'player-lee', 'league-season-kbo-2024', 2024, 88, 19, 5, 11, 43, 3, 71, 109, 94, 4, 2, 0, 0),
  ('player-season-choi-2024', 'player-choi', 'league-season-kbo-2024', 2024, 79, 24, 0, 17, 41, 1, 83, 112, 91, 5, 0, 0, 0),
  ('player-season-jung-2024', 'player-jung', 'league-season-kbo-2024', 2024, 83, 17, 4, 8, 36, 2, 64, 118, 85, 3, 4, 0, 0),
  ('player-season-yoon-2024', 'player-yoon', 'league-season-kbo-2024', 2024, 69, 14, 1, 10, 52, 6, 95, 84, 102, 6, 1, 0, 0),
  ('player-season-han-2024', 'player-han', 'league-season-kbo-2024', 2024, 90, 16, 3, 12, 34, 2, 76, 120, 88, 4, 2, 0, 0),
  ('player-season-shin-2024', 'player-shin', 'league-season-kbo-2024', 2024, 76, 20, 1, 19, 58, 5, 99, 92, 101, 3, 0, 0, 0);

insert into player_team_seasons (id, player_season_id, team_season_id)
values
  ('pts-hong-lg-2024', 'player-season-hong-2024', 'team-season-lg-2024'),
  ('pts-kim-lg-2024', 'player-season-kim-2024', 'team-season-lg-2024'),
  ('pts-park-lg-2024', 'player-season-park-2024', 'team-season-lg-2024'),
  ('pts-lee-lg-2024', 'player-season-lee-2024', 'team-season-lg-2024'),
  ('pts-choi-lg-2024', 'player-season-choi-2024', 'team-season-lg-2024'),
  ('pts-jung-lg-2024', 'player-season-jung-2024', 'team-season-lg-2024'),
  ('pts-yoon-lg-2024', 'player-season-yoon-2024', 'team-season-lg-2024'),
  ('pts-han-lg-2024', 'player-season-han-2024', 'team-season-lg-2024'),
  ('pts-shin-lg-2024', 'player-season-shin-2024', 'team-season-lg-2024');

insert into lineups (
  id,
  team_season_id,
  name,
  year,
  is_default
)
values (
  'lineup-lg-2024-default',
  'team-season-lg-2024',
  'LG 2024 기본 라인업',
  2024,
  true
);

insert into lineup_slots (id, lineup_id, slot_number, player_season_id)
values
  ('slot-lg-2024-1', 'lineup-lg-2024-default', 1, 'player-season-hong-2024'),
  ('slot-lg-2024-2', 'lineup-lg-2024-default', 2, 'player-season-kim-2024'),
  ('slot-lg-2024-3', 'lineup-lg-2024-default', 3, 'player-season-park-2024'),
  ('slot-lg-2024-4', 'lineup-lg-2024-default', 4, 'player-season-lee-2024'),
  ('slot-lg-2024-5', 'lineup-lg-2024-default', 5, 'player-season-choi-2024'),
  ('slot-lg-2024-6', 'lineup-lg-2024-default', 6, 'player-season-jung-2024'),
  ('slot-lg-2024-7', 'lineup-lg-2024-default', 7, 'player-season-yoon-2024'),
  ('slot-lg-2024-8', 'lineup-lg-2024-default', 8, 'player-season-han-2024'),
  ('slot-lg-2024-9', 'lineup-lg-2024-default', 9, 'player-season-shin-2024');

update team_seasons
set default_lineup_id = 'lineup-lg-2024-default'
where id = 'team-season-lg-2024';
