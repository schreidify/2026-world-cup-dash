# Phase 0 Data Validation Findings

Date: 2026-06-16

## Summary

Phase 0 validates api-football and openfootball data shapes before building the dashboard. Mock fixtures were captured for local development and tests. Live probing requires a valid `APIFOOTBALL_KEY`.

## api-football endpoints

### `/fixtures?league=1&season=2026&date={YYYY-MM-DD}`

| Field | Path |
|-------|------|
| Fixture ID | `response[].fixture.id` |
| Kickoff (ISO 8601) | `response[].fixture.date` |
| Status short code | `response[].fixture.status.short` |
| Elapsed minute | `response[].fixture.status.elapsed` |
| Venue | `response[].fixture.venue.name` |
| City | `response[].fixture.venue.city` |
| Stage/round | `response[].league.round` |
| Home team ID | `response[].teams.home.id` |
| Away team ID | `response[].teams.away.id` |
| Home score | `response[].goals.home` |
| Away score | `response[].goals.away` |

Status mapping: `NS`/`TBD` → scheduled; `1H`/`2H`/`HT`/`ET`/`P`/`LIVE` → live; `FT`/`AET`/`PEN` → finished.

Group letter is best effort from round name (e.g. "Group A - 1"). Full group assignment comes from standings.

### `/standings?league=1&season=2026`

Standings are nested: `response[].league.standings[][]`. Each row has `rank`, `team.id`, `group`, `all.played/win/draw/lose`, `all.goals.for/against`, `goalsDiff`, `points`.

### `/fixtures/statistics?fixture={id}`

Per team entry in `response[]` with `statistics[]` array of `{ type, value }`:

| Internal field | api-football type label |
|----------------|-------------------------|
| fouls | "Fouls" |
| yellow_cards | "Yellow Cards" |
| red_cards | "Red Cards" |
| shots | "Total Shots" |
| shots_on_target | "Shots on Goal" |

Goals come from the fixture record, not statistics.

### `/players?team={id}&season=2026`

Roster: `response[].player.name`, `response[].player.number`, position at `response[].statistics[0].games.position`.

## openfootball

CC0 data at `https://raw.githubusercontent.com/openfootball/worldcup.json/master/{year}/worldcup.json`.

Structure: `{ rounds: [{ name, matches: [{ team1: { name }, team2: { name }, score: { ft: [home, away] } }] }] }`.

Final round winner determined from `score.ft`. Country names must match api-football spelling for history joins.

Sample files: `test/fixtures/openfootball-1930.json`, `test/fixtures/openfootball-2022.json`.

## Rate limit budget

Free tier: ~100 requests/day. Planned usage:

- Hourly: 2 requests (fixtures + standings) ≈ 48/day
- Finished match stats: up to 6/day
- Roster backfill: 3 teams/hour when needed

Well under the daily limit.

## Missing fields / fallbacks

| Field | Status | Fallback |
|-------|--------|----------|
| streaming_channel | Not in api-football free tier | Hidden in UI |
| fixture group | Often absent in round name | Populated from standings/teams |
| Historical stats | Requires openfootball name match | Default to 0 appearances |

## Next steps

1. Set `APIFOOTBALL_KEY` in `.dev.vars` for local sync
2. Run `node scripts/probe.mjs` to refresh fixtures with live data
3. Run `node --experimental-strip-types scripts/seed-teams.mjs` to generate team seed SQL
