alter table leagues enable row level security;
alter table league_seasons enable row level security;
alter table teams enable row level security;
alter table players enable row level security;
alter table team_seasons enable row level security;
alter table player_seasons enable row level security;
alter table player_team_seasons enable row level security;
alter table lineups enable row level security;
alter table lineup_slots enable row level security;

grant select on leagues, league_seasons, teams, players, team_seasons, player_seasons, player_team_seasons, lineups, lineup_slots to anon, authenticated;
grant insert, update, delete on leagues, teams, players, league_seasons, team_seasons, player_seasons, player_team_seasons, lineups, lineup_slots to authenticated;

create policy "public read leagues"
on leagues
for select
to anon, authenticated
using (true);

create policy "authenticated write leagues"
on leagues
for all
to authenticated
using (true)
with check (true);

create policy "public read teams"
on teams
for select
to anon, authenticated
using (true);

create policy "authenticated write teams"
on teams
for all
to authenticated
using (true)
with check (true);

create policy "public read players"
on players
for select
to anon, authenticated
using (true);

create policy "authenticated write players"
on players
for all
to authenticated
using (true)
with check (true);

create policy "public read league seasons"
on league_seasons
for select
to anon, authenticated
using (true);

create policy "owner write league seasons"
on league_seasons
for all
to authenticated
using ((select auth.uid()) = creator_id)
with check ((select auth.uid()) = creator_id);

create policy "public read team seasons"
on team_seasons
for select
to anon, authenticated
using (true);

create policy "owner write team seasons"
on team_seasons
for all
to authenticated
using ((select auth.uid()) = creator_id)
with check ((select auth.uid()) = creator_id);

create policy "public read player seasons"
on player_seasons
for select
to anon, authenticated
using (true);

create policy "owner write player seasons"
on player_seasons
for all
to authenticated
using ((select auth.uid()) = creator_id)
with check ((select auth.uid()) = creator_id);

create policy "public read player team seasons"
on player_team_seasons
for select
to anon, authenticated
using (true);

create policy "authenticated write player team seasons"
on player_team_seasons
for all
to authenticated
using (true)
with check (true);

create policy "public read lineups"
on lineups
for select
to anon, authenticated
using (true);

create policy "owner write lineups"
on lineups
for all
to authenticated
using ((select auth.uid()) = creator_id)
with check ((select auth.uid()) = creator_id);

create policy "public read lineup slots"
on lineup_slots
for select
to anon, authenticated
using (true);

create policy "authenticated write lineup slots"
on lineup_slots
for all
to authenticated
using (true)
with check (true);
