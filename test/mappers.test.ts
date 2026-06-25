import { describe, it, expect } from "vitest";
import fixturesPayload from "./fixtures/fixtures-by-date.json";
import { mapFixtures, mapStandings, mapMatchStats, mapPlayers } from "../src/sync/mappers";

describe("mapFixtures", () => {
  it("maps the vendor fixtures payload to internal Fixture objects", () => {
    const result = mapFixtures(fixturesPayload as any);
    expect(result.length).toBe((fixturesPayload as any).response.length);
    const f = result[0];
    expect(typeof f.api_fixture_id).toBe("number");
    expect(["scheduled", "live", "finished"]).toContain(f.status);
    expect(typeof f.home_team_id).toBe("number");
    expect(typeof f.away_team_id).toBe("number");
    expect(typeof f.datetime_utc).toBe("string");
  });

  it("maps a not-started fixture to scheduled with null scores", () => {
    const vendor = {
      response: [
        {
          fixture: {
            id: 1,
            date: "2026-06-20T18:00:00+00:00",
            status: { short: "NS", elapsed: null },
            venue: { name: "MetLife Stadium", city: "East Rutherford" },
          },
          league: { round: "Group Stage - 1" },
          teams: { home: { id: 10 }, away: { id: 20 } },
          goals: { home: null, away: null },
        },
      ],
    };
    const [f] = mapFixtures(vendor as any);
    expect(f.status).toBe("scheduled");
    expect(f.home_score).toBeNull();
    expect(f.elapsed_minute).toBeNull();
    expect(f.venue).toBe("MetLife Stadium");
    expect(f.city).toBe("East Rutherford");
  });

  it("maps a live fixture to live with elapsed minute", () => {
    const vendor = {
      response: [
        {
          fixture: {
            id: 2,
            date: "2026-06-20T18:00:00+00:00",
            status: { short: "2H", elapsed: 67 },
            venue: { name: "x", city: "y" },
          },
          league: { round: "Group Stage - 1" },
          teams: { home: { id: 10 }, away: { id: 20 } },
          goals: { home: 1, away: 0 },
        },
      ],
    };
    const [f] = mapFixtures(vendor as any);
    expect(f.status).toBe("live");
    expect(f.elapsed_minute).toBe(67);
    expect(f.home_score).toBe(1);
  });

  it("maps a finished fixture to finished", () => {
    const vendor = {
      response: [
        {
          fixture: {
            id: 3,
            date: "2026-06-20T18:00:00+00:00",
            status: { short: "FT", elapsed: 90 },
            venue: { name: "x", city: "y" },
          },
          league: { round: "Round of 16" },
          teams: { home: { id: 10 }, away: { id: 20 } },
          goals: { home: 2, away: 1 },
        },
      ],
    };
    const [f] = mapFixtures(vendor as any);
    expect(f.status).toBe("finished");
    expect(f.home_score).toBe(2);
    expect(f.away_score).toBe(1);
  });
});

describe("mapStandings", () => {
  it("flattens api-football grouped standings into Standing rows", () => {
    const vendor = {
      response: [
        {
          league: {
            standings: [
              [
                {
                  rank: 1,
                  team: { id: 10 },
                  group: "Group A",
                  all: { played: 3, win: 2, draw: 1, lose: 0, goals: { for: 5, against: 2 } },
                  goalsDiff: 3,
                  points: 7,
                },
                {
                  rank: 2,
                  team: { id: 20 },
                  group: "Group A",
                  all: { played: 3, win: 1, draw: 1, lose: 1, goals: { for: 3, against: 3 } },
                  goalsDiff: 0,
                  points: 4,
                },
              ],
            ],
          },
        },
      ],
    };
    const rows = mapStandings(vendor as any);
    expect(rows.length).toBe(2);
    expect(rows[0]).toMatchObject({
      group: "A",
      team_id: 10,
      played: 3,
      win: 2,
      draw: 1,
      loss: 0,
      gf: 5,
      ga: 2,
      gd: 3,
      points: 7,
      rank: 1,
    });
  });

  it("ignores overall Group Stage standings that duplicate per-group rows", () => {
    const vendor = {
      response: [
        {
          league: {
            standings: [
              [
                {
                  rank: 1,
                  team: { id: 6 },
                  group: "Group C",
                  all: { played: 3, win: 2, draw: 1, lose: 0, goals: { for: 7, against: 1 } },
                  goalsDiff: 6,
                  points: 7,
                },
              ],
              [
                {
                  rank: 2,
                  team: { id: 6 },
                  group: "Group Stage",
                  all: { played: 1, win: 0, draw: 1, lose: 0, goals: { for: 1, against: 1 } },
                  goalsDiff: 0,
                  points: 1,
                },
              ],
            ],
          },
        },
      ],
    };
    const rows = mapStandings(vendor as any);
    expect(rows).toEqual([
      expect.objectContaining({ group: "C", team_id: 6, points: 7, win: 2, draw: 1, gd: 6 }),
    ]);
  });
});

describe("mapMatchStats", () => {
  it("maps per-team statistics, defaulting missing types to 0", () => {
    const vendor = {
      response: [
        {
          team: { id: 10 },
          statistics: [
            { type: "Total Shots", value: 12 },
            { type: "Shots on Goal", value: 5 },
            { type: "Fouls", value: 9 },
            { type: "Yellow Cards", value: 2 },
            { type: "Red Cards", value: null },
          ],
        },
        {
          team: { id: 20 },
          statistics: [
            { type: "Total Shots", value: 8 },
            { type: "Fouls", value: 14 },
            { type: "Yellow Cards", value: 3 },
            { type: "Red Cards", value: 1 },
          ],
        },
      ],
    };
    const rows = mapMatchStats(vendor as any, 99, { 10: 2, 20: 1 });
    const home = rows.find((r) => r.team_id === 10)!;
    expect(home).toMatchObject({
      fixture_id: 99,
      team_id: 10,
      goals: 2,
      fouls: 9,
      yellow_cards: 2,
      red_cards: 0,
      shots: 12,
      shots_on_target: 5,
    });
    const away = rows.find((r) => r.team_id === 20)!;
    expect(away.shots_on_target).toBe(0);
    expect(away.red_cards).toBe(1);
  });
});

describe("mapPlayers", () => {
  it("maps the players payload to Player rows", () => {
    const vendor = {
      response: [
        { player: { name: "Jane Doe", number: 9 }, statistics: [{ games: { position: "Attacker" } }] },
        { player: { name: "Sam Roe", number: null }, statistics: [{ games: { position: "Defender" } }] },
      ],
    };
    const rows = mapPlayers(vendor as any, 10);
    expect(rows).toEqual([
      { team_id: 10, name: "Jane Doe", position: "Attacker", shirt_number: 9 },
      { team_id: 10, name: "Sam Roe", position: "Defender", shirt_number: null },
    ]);
  });
});
