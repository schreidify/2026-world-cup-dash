import type { Env } from "../index";
import {
  getFixturesInRange,
  getTopStandings,
  getStandingsByGroup,
  getTeams,
  getPlayersByTeam,
  getLastSync,
  getStandingForTeam,
  getNextGameForTeam,
} from "../db/queries";
import { addDaysYmd, localDateYmd, localDayBoundsUtc } from "../lib/dates";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "public, max-age=60" },
  });
}

export async function handleApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  if (path === "/api/sync" && request.method === "POST") {
    const { runHourlySync } = await import("../sync/sync");
    await runHourlySync(env);
    const last = await getLastSync(env.DB);
    return json({ ok: true, dataAsOf: last?.ran_at ?? null });
  }

  if (path === "/api/today" || path === "/api/tomorrow") {
    const tz = url.searchParams.get("tz") || "UTC";
    const dateYmd =
      path === "/api/tomorrow" ? addDaysYmd(localDateYmd(tz), 1) : localDateYmd(tz);
    const { startUtc, endUtc } = localDayBoundsUtc(dateYmd, tz);
    const fixtures = await getFixturesInRange(env.DB, startUtc, endUtc);
    const last = await getLastSync(env.DB);
    return json({ fixtures, dataAsOf: last?.ran_at ?? null });
  }

  if (path === "/api/standings") {
    const standings = await getTopStandings(env.DB, 10);
    return json({ standings });
  }

  if (path === "/api/standings/groups") {
    const standings = await getStandingsByGroup(env.DB);
    return json({ standings });
  }

  if (path === "/api/teams") {
    const teams = await getTeams(env.DB);
    return json({ teams });
  }

  const rosterMatch = path.match(/^\/api\/teams\/(\d+)\/roster$/);
  if (rosterMatch) {
    const players = await getPlayersByTeam(env.DB, Number(rosterMatch[1]));
    return json({ players });
  }

  const detailMatch = path.match(/^\/api\/teams\/(\d+)\/detail$/);
  if (detailMatch) {
    const id = Number(detailMatch[1]);
    const [standing, nextGame, players] = await Promise.all([
      getStandingForTeam(env.DB, id),
      getNextGameForTeam(env.DB, id, new Date().toISOString()),
      getPlayersByTeam(env.DB, id),
    ]);
    return json({ standing, nextGame, roster: players });
  }

  return json({ error: "not found" }, 404);
}
