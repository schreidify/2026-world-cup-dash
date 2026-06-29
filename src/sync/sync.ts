import type { Env } from "../index";
import { fetchFixtures, fetchStandings, fetchPlayers, fetchFixtureStatistics } from "./apifootball";
import { mapFixtures, mapStandings, mapPlayers, mapMatchStats } from "./mappers";
import { upsertFixtures, upsertStandings, upsertPlayers, upsertMatchStats, logSync } from "../db/queries";
import { tryAcquireSyncLock, releaseSyncLock } from "./mutex";

export interface SyncDeps {
  fetchFixtures: (key: string) => Promise<any>;
  fetchStandings: (key: string) => Promise<any>;
  fetchPlayers: (key: string, teamId: number) => Promise<any>;
  fetchFixtureStatistics: (key: string, fixtureId: number) => Promise<any>;
}

export type SyncResult =
  | { status: "ok"; requestsUsed: number }
  | { status: "error"; requestsUsed: number; error: string }
  | { status: "skipped"; reason: string };

const defaultDeps: SyncDeps = {
  fetchFixtures,
  fetchStandings,
  fetchPlayers,
  fetchFixtureStatistics,
};

// Keep scheduled roster backfill intentionally small so cron syncs stay under
// low daily API quotas once fixture/standings requests are accounted for.
const ROSTERS_PER_RUN = 1;
const MATCH_STATS_PER_RUN = 1;

function syncErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

export async function runHourlySync(env: Env, deps: Partial<SyncDeps> = {}): Promise<SyncResult> {
  if (!(await tryAcquireSyncLock(env.DB))) {
    return { status: "skipped", reason: "sync already in progress" };
  }

  const d = { ...defaultDeps, ...deps };
  let requests = 0;
  try {
    const fixtures = mapFixtures(await d.fetchFixtures(env.APIFOOTBALL_KEY));
    requests++;
    await upsertFixtures(env.DB, fixtures);

    const standingsRaw = await d.fetchStandings(env.APIFOOTBALL_KEY);
    requests++;
    await env.DB.prepare(`DELETE FROM standings`).run();
    await upsertStandings(env.DB, mapStandings(standingsRaw));

    const finished = fixtures.filter((f) => f.status === "finished");
    let matchStatsFetched = 0;
    for (const f of finished) {
      if (matchStatsFetched >= MATCH_STATS_PER_RUN) break;
      const existing = await env.DB
        .prepare(`SELECT 1 FROM match_stats WHERE fixture_id = ? LIMIT 1`)
        .bind(f.api_fixture_id)
        .first();
      if (existing) continue;
      if (f.home_team_id == null || f.away_team_id == null) continue;
      const raw = await d.fetchFixtureStatistics(env.APIFOOTBALL_KEY, f.api_fixture_id);
      requests++;
      const goalsByTeam: Record<number, number> = {
        [f.home_team_id]: f.home_score ?? 0,
        [f.away_team_id]: f.away_score ?? 0,
      };
      await upsertMatchStats(env.DB, mapMatchStats(raw, f.api_fixture_id, goalsByTeam));
      matchStatsFetched++;
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

    await logSync(env.DB, "api-football", "ok", requests, null);
    return { status: "ok", requestsUsed: requests };
  } catch (err) {
    const error = syncErrorMessage(err);
    await logSync(env.DB, "api-football", "error", requests, error);
    console.error("hourly sync failed", err);
    return { status: "error", requestsUsed: requests, error };
  } finally {
    await releaseSyncLock(env.DB);
  }
}
