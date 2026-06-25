import type { Env } from "../index";
import { fetchFixturesByDate, fetchStandings, fetchPlayers, fetchFixtureStatistics } from "./apifootball";
import { mapFixtures, mapStandings, mapPlayers, mapMatchStats } from "./mappers";
import { upsertFixtures, upsertStandings, upsertPlayers, upsertMatchStats, logSync } from "../db/queries";
import { utcDatesAroundToday } from "../lib/dates";
import type { Fixture } from "../types";

export interface SyncDeps {
  fetchFixturesByDate: (key: string, date: string) => Promise<any>;
  fetchStandings: (key: string) => Promise<any>;
  fetchPlayers: (key: string, teamId: number) => Promise<any>;
  fetchFixtureStatistics: (key: string, fixtureId: number) => Promise<any>;
}

const defaultDeps: SyncDeps = {
  fetchFixturesByDate,
  fetchStandings,
  fetchPlayers,
  fetchFixtureStatistics,
};

const ROSTERS_PER_RUN = 3;

export async function runHourlySync(env: Env, deps: Partial<SyncDeps> = {}): Promise<void> {
  const d = { ...defaultDeps, ...deps };
  let requests = 0;
  try {
    const fixturesById = new Map<number, Fixture>();
    for (const date of utcDatesAroundToday()) {
      const fixturesPayloadRaw = await d.fetchFixturesByDate(env.APIFOOTBALL_KEY, date);
      requests++;
      for (const fixture of mapFixtures(fixturesPayloadRaw)) {
        fixturesById.set(fixture.api_fixture_id, fixture);
      }
    }
    const fixtures = [...fixturesById.values()];
    await upsertFixtures(env.DB, fixtures);

    const standingsRaw = await d.fetchStandings(env.APIFOOTBALL_KEY);
    requests++;
    await upsertStandings(env.DB, mapStandings(standingsRaw));

    const finished = fixtures.filter((f) => f.status === "finished");
    for (const f of finished) {
      const existing = await env.DB
        .prepare(`SELECT 1 FROM match_stats WHERE fixture_id = ? LIMIT 1`)
        .bind(f.api_fixture_id)
        .first();
      if (existing) continue;
      const raw = await d.fetchFixtureStatistics(env.APIFOOTBALL_KEY, f.api_fixture_id);
      requests++;
      const goalsByTeam: Record<number, number> = {
        [f.home_team_id]: f.home_score ?? 0,
        [f.away_team_id]: f.away_score ?? 0,
      };
      await upsertMatchStats(env.DB, mapMatchStats(raw, f.api_fixture_id, goalsByTeam));
    }

    const { results: needRoster } = await env.DB
      .prepare(
        `SELECT t.id FROM teams t LEFT JOIN players p ON p.team_id = t.id
                WHERE p.team_id IS NULL GROUP BY t.id LIMIT ?`,
      )
      .bind(ROSTERS_PER_RUN)
      .all<{ id: number }>();
    for (const { id } of needRoster) {
      const raw = await d.fetchPlayers(env.APIFOOTBALL_KEY, id);
      requests++;
      await upsertPlayers(env.DB, mapPlayers(raw, id));
    }

    await logSync(env.DB, "api-football", "ok", requests);
  } catch (err) {
    await logSync(env.DB, "api-football", "error", requests);
    console.error("hourly sync failed", err);
  }
}
