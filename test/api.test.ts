import { describe, it, expect, beforeEach } from "vitest";
import { env, SELF } from "cloudflare:test";
import { upsertFixtures, upsertStandings, upsertTeams, upsertPlayers } from "../src/db/queries";

beforeEach(async () => {
  await env.DB.exec("DELETE FROM fixtures");
  await env.DB.exec("DELETE FROM standings");
  await env.DB.exec("DELETE FROM teams");
  await env.DB.exec("DELETE FROM sync_log");
});

describe("GET /api/today", () => {
  it("returns today's fixtures and a data-as-of timestamp", async () => {
    const today = new Date().toISOString().slice(0, 10);
    await upsertFixtures(env.DB, [
      {
        api_fixture_id: 1,
        stage: "Group A",
        group: "A",
        datetime_utc: today + "T18:00:00.000Z",
        venue: "v",
        city: "c",
        home_team_id: 10,
        away_team_id: 20,
        status: "live",
        elapsed_minute: 67,
        home_score: 1,
        away_score: 0,
        streaming_channel: null,
      },
    ]);
    await env.DB.prepare(
      `INSERT INTO sync_log (ran_at, source, status, requests_used) VALUES (?, 'api-football', 'ok', 2)`,
    )
      .bind(new Date().toISOString())
      .run();

    const res = await SELF.fetch("https://example.com/api/today?tz=UTC");
    expect(res.status).toBe(200);
    const body = await res.json<any>();
    expect(body.fixtures.length).toBe(1);
    expect(body.fixtures[0].status).toBe("live");
    expect(body.dataAsOf).toBeTruthy();
  });

  it("includes finished fixtures with scores", async () => {
    const today = new Date().toISOString().slice(0, 10);
    await upsertFixtures(env.DB, [
      {
        api_fixture_id: 2,
        stage: "Group B",
        group: "B",
        datetime_utc: today + "T14:00:00.000Z",
        venue: "v",
        city: "c",
        home_team_id: 10,
        away_team_id: 20,
        status: "finished",
        elapsed_minute: null,
        home_score: 3,
        away_score: 1,
        streaming_channel: null,
      },
    ]);

    const res = await SELF.fetch("https://example.com/api/today?tz=UTC");
    const body = await res.json<any>();
    expect(body.fixtures.some((f: any) => f.status === "finished" && f.home_score === 3)).toBe(true);
  });
});

describe("GET /api/tomorrow", () => {
  it("returns fixtures scheduled for tomorrow in the requested timezone", async () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    await upsertFixtures(env.DB, [
      {
        api_fixture_id: 3,
        stage: "Group C",
        group: "C",
        datetime_utc: tomorrow + "T20:00:00.000Z",
        venue: "v",
        city: "c",
        home_team_id: 10,
        away_team_id: 20,
        status: "scheduled",
        elapsed_minute: null,
        home_score: null,
        away_score: null,
        streaming_channel: null,
      },
    ]);

    const res = await SELF.fetch("https://example.com/api/tomorrow?tz=UTC");
    expect(res.status).toBe(200);
    const body = await res.json<any>();
    expect(body.fixtures.length).toBe(1);
    expect(body.fixtures[0].status).toBe("scheduled");
  });
});

describe("GET /api/standings", () => {
  it("returns top standings", async () => {
    await upsertStandings(env.DB, [
      {
        group: "A",
        team_id: 10,
        played: 1,
        win: 1,
        loss: 0,
        draw: 0,
        gf: 2,
        ga: 0,
        gd: 2,
        points: 3,
        rank: 1,
      },
    ]);
    const res = await SELF.fetch("https://example.com/api/standings");
    expect(res.status).toBe(200);
    const body = await res.json<any>();
    expect(body.standings[0].team_id).toBe(10);
  });
});

describe("GET /api/teams", () => {
  it("returns the teams list", async () => {
    await upsertTeams(env.DB, [
      {
        id: 10,
        country: "Brazil",
        group: "A",
        flag: "f",
        fifa_code: "BRA",
        appearances_since_1930: 22,
        last_appearance: 2022,
        wins_since_1930: 5,
      },
    ]);
    const res = await SELF.fetch("https://example.com/api/teams");
    const body = await res.json<any>();
    expect(body.teams[0].country).toBe("Brazil");
  });
});

describe("GET /api/bracket", () => {
  it("returns ordered knockout rounds with published fixtures and TBD slots", async () => {
    await upsertTeams(env.DB, [
      {
        id: 10,
        country: "Brazil",
        group: "A",
        flag: "f",
        fifa_code: "BRA",
        appearances_since_1930: 22,
        last_appearance: 2022,
        wins_since_1930: 5,
      },
      {
        id: 20,
        country: "Croatia",
        group: "B",
        flag: "f",
        fifa_code: "CRO",
        appearances_since_1930: 6,
        last_appearance: 2022,
        wins_since_1930: 0,
      },
    ]);
    await upsertFixtures(env.DB, [
      {
        api_fixture_id: 700,
        stage: "Round of 16",
        group: null,
        datetime_utc: "2026-07-04T18:00:00.000Z",
        venue: "MetLife",
        city: "East Rutherford",
        home_team_id: 10,
        away_team_id: 20,
        status: "scheduled",
        elapsed_minute: null,
        home_score: null,
        away_score: null,
        streaming_channel: null,
      },
    ]);
    await env.DB.prepare(
      `INSERT INTO sync_log (ran_at, source, status, requests_used) VALUES (?, 'api-football', 'ok', 1)`,
    )
      .bind("2026-07-03T12:00:00.000Z")
      .run();

    const res = await SELF.fetch("https://example.com/api/bracket");
    expect(res.status).toBe(200);
    const body = await res.json<any>();
    expect(body.dataAsOf).toBe("2026-07-03T12:00:00.000Z");
    expect(body.rounds.map((round: any) => round.key)).toEqual([
      "round_of_32",
      "round_of_16",
      "quarter_final",
      "semi_final",
      "third_place",
      "final",
    ]);
    expect(body.rounds[1].matches[0]).toMatchObject({
      slotId: "R16-1",
      fixtureId: 700,
      homeLabel: "Brazil",
      awayLabel: "Croatia",
    });
    expect(body.rounds[2].matches[0]).toMatchObject({
      slotId: "QF-1",
      status: "tbd",
      homeLabel: "Winner R16 1",
      awayLabel: "Winner R16 2",
    });
  });
});

describe("GET /api/teams/:id/detail", () => {
  it("returns the team's standing, next game, and roster", async () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    await upsertTeams(env.DB, [
      {
        id: 10,
        country: "Brazil",
        group: "A",
        flag: "f",
        fifa_code: "BRA",
        appearances_since_1930: 22,
        last_appearance: 2022,
        wins_since_1930: 5,
      },
    ]);
    await upsertStandings(env.DB, [
      {
        group: "A",
        team_id: 10,
        played: 1,
        win: 1,
        loss: 0,
        draw: 0,
        gf: 2,
        ga: 0,
        gd: 2,
        points: 3,
        rank: 1,
      },
    ]);
    await upsertFixtures(env.DB, [
      {
        api_fixture_id: 1,
        stage: "Group A",
        group: "A",
        datetime_utc: future,
        venue: "v",
        city: "c",
        home_team_id: 10,
        away_team_id: 20,
        status: "scheduled",
        elapsed_minute: null,
        home_score: null,
        away_score: null,
        streaming_channel: null,
      },
    ]);
    await upsertPlayers(env.DB, [{ team_id: 10, name: "Star", position: "Attacker", shirt_number: 10 }]);

    const res = await SELF.fetch("https://example.com/api/teams/10/detail");
    expect(res.status).toBe(200);
    const body = await res.json<any>();
    expect(body.standing.points).toBe(3);
    expect(body.nextGame.api_fixture_id).toBe(1);
    expect(body.roster[0].name).toBe("Star");
  });
});

describe("unknown api route", () => {
  it("returns 404 for /api/nope", async () => {
    const res = await SELF.fetch("https://example.com/api/nope");
    expect(res.status).toBe(404);
  });
});
