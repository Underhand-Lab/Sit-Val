# Sit-Val ERD

```mermaid
erDiagram
    LEAGUES ||--o{ LEAGUE_SEASONS : has
    TEAMS ||--o{ TEAM_SEASONS : has
    PLAYERS ||--o{ PLAYER_SEASONS : has
    LEAGUE_SEASONS ||--o{ TEAM_SEASONS : groups
    LEAGUE_SEASONS ||--o{ PLAYER_SEASONS : contextualizes
    TEAM_SEASONS ||--o{ PLAYER_TEAM_SEASONS : links
    PLAYER_SEASONS ||--o{ PLAYER_TEAM_SEASONS : joins
    TEAM_SEASONS ||--o{ LINEUPS : owns
    LINEUPS ||--|{ LINEUP_SLOTS : contains
    PLAYER_SEASONS ||--o{ LINEUP_SLOTS : fills

    LEAGUES {
        text id PK
        text code
        text name
    }

    LEAGUE_SEASONS {
        text id PK
        text league_id FK
        int year
        int single_hits
        int double_hits
        int triple_hits
        int hr
        int bb
        int hbp
        int so
        int go
        int fo
        int sf
        int sh
        float passedball
        float s_r1_r2_safe
        float s_r1_r2_out
    }

    TEAMS {
        text id PK
        text code
        text name
    }

    TEAM_SEASONS {
        text id PK
        text team_id FK
        text league_season_id FK
        int year
        text default_lineup_id FK
        float passedball
        float s_r1_r2_safe
        float s_r1_r2_out
    }

    PLAYERS {
        text id PK
        text name
        text bats
        text throws
        text position
    }

    PLAYER_SEASONS {
        text id PK
        text player_id FK
        text league_season_id FK
        int year
        int single_hits
        int double_hits
        int triple_hits
        int hr
        int bb
        int hbp
        int so
        int go
        int fo
        int sf
        int sh
    }

    PLAYER_TEAM_SEASONS {
        text id PK
        text player_season_id FK
        text team_season_id FK
    }

    LINEUPS {
        text id PK
        text team_season_id FK
        text name
        int year
        boolean is_default
    }

    LINEUP_SLOTS {
        text id PK
        text lineup_id FK
        int slot_number
        text player_season_id FK
    }
```

## Notes

* `team_seasons -> lineups -> lineup_slots -> player_seasons` is the lineup calculation path.
* `player_team_seasons` allows one player season to belong to multiple teams in the same year.
* Runner values are stored directly on `league_seasons` and optionally overridden on `team_seasons`.
* Fallback for lineup calculation is:
  * `team_seasons.runner_*`
  * `league_seasons.runner_*`
  * app default constants
