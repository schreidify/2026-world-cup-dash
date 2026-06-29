import { describe, it, expect, beforeEach } from "vitest";
import { env } from "cloudflare:test";
import { runHourlySync } from "../src/sync/sync";
import { getTodaysFixtures, getTopStandings, getLastSync, getPlayersByTeam } from "../src/db/queries";

const fixturesPayload = {
  response: [
    {
      fixture: {
        id: 1,
        date: new Date().toISOString().slice(0, 10) + "T18:00:00+00:00",
        status: { short: "NS", elapsed: null },
        venue: { name: "v", city: "c" },
      },
      league: { round: "Group A - 1" },
      teams: { home: { id: 10 }, away: { id: 20 } },
      goals: { home: null, away: null },
    },
  ],
};
const standingsPayload = {
  response: [
    {
      league: {
        standings: [
          [
            {
              rank: 1,
              team: { id: 10 },
              group: "Group A",
              all: { played: 1, win: 1, draw: 0, lose: 0, goals: { for: 2, against: 0 } },
              goalsDiff: 2,
              points: 3,
            },
          ],
        ],
      },
    },
  ],
};

beforeEach(async () => {
  await env.DB.exec("DELETE FROM fixtures");
  await env.DB.exec("DELETE FROM standings");
  await env.DB.exec("DELETE FROM sync_log");
  await env.DB.exec("UPDATE sync_lock SET locked_at = NULL WHERE id = 1");
});

describe("runHourlySync", () => {
  it("fetches, maps, and persists fixtures and standings, then logs success", async () => {
    await runHourlySync(env, {
      fetchFixtures: async () => fixturesPayload,
      fetchStandings: async () => standingsPayload,
    });
    const today = new Date().toISOString().slice(0, 10);
    expect((await getTodaysFixtures(env.DB, today)).length).toBe(1);
    expect((await getTopStandings(env.DB, 10)).length).toBe(1);
    expect(await getLastSync(env.DB)).not.toBeNull();
  });

  it("stores knockout fixtures from the season payload without breaking day queries", async () => {
    const today = new Date().toISOString().slice(0, 10);
    await runHourlySync(env, {
      fetchFixtures: async () => ({
        response: [
          {
            fixture: {
              id: 900,
              date: today + "T18:00:00+00:00",
              status: { short: "NS", elapsed: null },
              venue: { name: "v", city: "c" },
            },
            league: { round: "Round of 16 - 1" },
            teams: { home: { id: 10 }, away: { id: 20 } },
            goals: { home: null, away: null },
          },
        ],
      }),
      fetchStandings: async () => ({ response: [] }),
      fetchPlayers: async () => ({ response: [] }),
    });

    const rows = await getTodaysFixtures(env.DB, today);
    expect(rows).toHaveLength(1);
    expect(rows[0].stage).toBe("Round of 16");
  });

  it("logs an error status when a fetch throws, without crashing", async () => {
    const result = await runHourlySync(env, {
      fetchFixtures: async () => {
        throw new Error("boom");
      },
      fetchStandings: async () => standingsPayload,
    });
    expect(result.status).toBe("error");
    const row = await env.DB.prepare("SELECT status, error_message FROM sync_log").first<{
      status: string;
      error_message: string;
    }>();
    expect(row?.status).toBe("error");
    expect(row?.error_message).toBe("boom");
  });

  it("skips when another sync is already in progress", async () => {
    await env.DB.prepare(`UPDATE sync_lock SET locked_at = ? WHERE id = 1`).bind(new Date().toISOString()).run();
    const result = await runHourlySync(env, {
      fetchFixtures: async () => fixturesPayload,
      fetchStandings: async () => standingsPayload,
    });
    expect(result.status).toBe("skipped");
  });
});

describe("roster backfill in sync", () => {
  it("fetches and stores a roster for a team that has none", async () => {
    await env.DB.exec("DELETE FROM players");
    await env.DB.exec("DELETE FROM teams");
    await env.DB.prepare(`INSERT INTO teams (id, country) VALUES (10, 'Brazil')`).run();

    await runHourlySync(env, {
      fetchFixtures: async () => ({ response: [] }),
      fetchStandings: async () => ({ response: [] }),
      fetchPlayers: async (_k: string, teamId: number) => ({
        response: [
          { player: { name: "Player " + teamId, number: 9 }, statistics: [{ games: { position: "Attacker" } }] },
        ],
      }),
    });

    const players = await getPlayersByTeam(env.DB, 10);
    expect(players.length).toBe(1);
    expect(players[0].name).toBe("Player 10");
  });
});

describe("match-stats collection on finished matches", () => {
  it("pulls stats once for a finished fixture lacking match_stats", async () => {
    await env.DB.exec("DELETE FROM fixtures");
    await env.DB.exec("DELETE FROM match_stats");

    const today = new Date().toISOString().slice(0, 10);
    const finishedFixtures = {
      response: [
        {
          fixture: {
            id: 500,
            date: today + "T15:00:00+00:00",
            status: { short: "FT", elapsed: 90 },
            venue: { name: "v", city: "c" },
          },
          league: { round: "Group A - 1" },
          teams: { home: { id: 10 }, away: { id: 20 } },
          goals: { home: 2, away: 1 },
        },
      ],
    };
    const statsPayload = {
      response: [
        {
          team: { id: 10 },
          statistics: [
            { type: "Total Shots", value: 12 },
            { type: "Fouls", value: 9 },
            { type: "Yellow Cards", value: 2 },
          ],
        },
        {
          team: { id: 20 },
          statistics: [
            { type: "Total Shots", value: 7 },
            { type: "Fouls", value: 11 },
            { type: "Yellow Cards", value: 1 },
          ],
        },
      ],
    };
    let statsCalls = 0;

    await runHourlySync(env, {
      fetchFixtures: async () => finishedFixtures,
      fetchStandings: async () => ({ response: [] }),
      fetchPlayers: async () => ({ response: [] }),
      fetchFixtureStatistics: async (_k: string, fixtureId: number) => {
        statsCalls++;
        return statsPayload;
      },
    });

    const { results } = await env.DB.prepare("SELECT * FROM match_stats WHERE fixture_id = 500").all();
    expect(results.length).toBe(2);
    expect(statsCalls).toBe(1);

    await runHourlySync(env, {
      fetchFixtures: async () => finishedFixtures,
      fetchStandings: async () => ({ response: [] }),
      fetchPlayers: async () => ({ response: [] }),
      fetchFixtureStatistics: async () => {
        statsCalls++;
        return statsPayload;
      },
    });
    expect(statsCalls).toBe(1);
  });

  it("caps new match-stats fetches per run to avoid bursting the API", async () => {
    await env.DB.exec("DELETE FROM fixtures");
    await env.DB.exec("DELETE FROM match_stats");

    const today = new Date().toISOString().slice(0, 10);
    const finishedFixtures = {
      response: [
        {
          fixture: {
            id: 500,
            date: today + "T15:00:00+00:00",
            status: { short: "FT", elapsed: 90 },
            venue: { name: "v", city: "c" },
          },
          league: { round: "Group A - 1" },
          teams: { home: { id: 10 }, away: { id: 20 } },
          goals: { home: 2, away: 1 },
        },
        {
          fixture: {
            id: 501,
            date: today + "T18:00:00+00:00",
            status: { short: "FT", elapsed: 90 },
            venue: { name: "v2", city: "c2" },
          },
          league: { round: "Group A - 2" },
          teams: { home: { id: 30 }, away: { id: 40 } },
          goals: { home: 1, away: 0 },
        },
      ],
    };
    let statsCalls = 0;

    await runHourlySync(env, {
      fetchFixtures: async () => finishedFixtures,
      fetchStandings: async () => ({ response: [] }),
      fetchPlayers: async () => ({ response: [] }),
      fetchFixtureStatistics: async () => {
        statsCalls++;
        return { response: [] };
      },
    });

    expect(statsCalls).toBe(1);
  });
});
