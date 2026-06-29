import { describe, it, expect } from "vitest";
import { buildBracket, normalizeKnockoutStage } from "../src/lib/bracket";
import type { Fixture, Team } from "../src/types";

const teams: Team[] = [
  {
    id: 10,
    country: "Brazil",
    group: "A",
    flag: null,
    fifa_code: "BRA",
    appearances_since_1930: 22,
    last_appearance: 2022,
    wins_since_1930: 5,
  },
  {
    id: 20,
    country: "Croatia",
    group: "A",
    flag: null,
    fifa_code: "CRO",
    appearances_since_1930: 6,
    last_appearance: 2022,
    wins_since_1930: 0,
  },
  {
    id: 30,
    country: "France",
    group: "B",
    flag: null,
    fifa_code: "FRA",
    appearances_since_1930: 16,
    last_appearance: 2022,
    wins_since_1930: 2,
  },
  {
    id: 35,
    country: "Japan",
    group: "B",
    flag: null,
    fifa_code: "JPN",
    appearances_since_1930: 7,
    last_appearance: 2022,
    wins_since_1930: 0,
  },
  {
    id: 40,
    country: "Argentina",
    group: "B",
    flag: null,
    fifa_code: "ARG",
    appearances_since_1930: 18,
    last_appearance: 2022,
    wins_since_1930: 3,
  },
  {
    id: 50,
    country: "Canada",
    group: "C",
    flag: null,
    fifa_code: "CAN",
    appearances_since_1930: 3,
    last_appearance: 2022,
    wins_since_1930: 0,
  },
];

function fixture(overrides: Partial<Fixture>): Fixture {
  return {
    api_fixture_id: 1,
    stage: "Round of 32",
    group: null,
    datetime_utc: "2026-06-28T18:00:00.000Z",
    venue: "MetLife",
    city: "East Rutherford",
    home_team_id: 10,
    away_team_id: 20,
    status: "scheduled",
    elapsed_minute: null,
    home_score: null,
    away_score: null,
    streaming_channel: null,
    ...overrides,
  };
}

describe("normalizeKnockoutStage", () => {
  it("maps supported vendor labels to canonical stages", () => {
    expect(normalizeKnockoutStage("Round of 32 - 4")).toBe("round_of_32");
    expect(normalizeKnockoutStage("Round of 16")).toBe("round_of_16");
    expect(normalizeKnockoutStage("Quarter-finals - 2")).toBe("quarter_final");
    expect(normalizeKnockoutStage("Semi-finals")).toBe("semi_final");
    expect(normalizeKnockoutStage("3rd Place Final")).toBe("third_place");
    expect(normalizeKnockoutStage("Final")).toBe("final");
  });
});

describe("buildBracket", () => {
  it("returns ordered rounds with stable slot counts", () => {
    const rounds = buildBracket([], teams);
    expect(rounds.map((round) => round.key)).toEqual([
      "round_of_32",
      "round_of_16",
      "quarter_final",
      "semi_final",
      "third_place",
      "final",
    ]);
    expect(rounds.map((round) => round.matches.length)).toEqual([16, 8, 4, 2, 1, 1]);
  });

  it("fills unpublished matches with TBD structure labels", () => {
    const rounds = buildBracket([], teams);
    expect(rounds[0].matches[0]).toMatchObject({
      slotId: "R32-1",
      homeLabel: "TBD",
      awayLabel: "TBD",
      status: "tbd",
    });
    expect(rounds[1].matches[0]).toMatchObject({
      slotId: "R16-1",
      homeLabel: "Winner R32 1",
      awayLabel: "Winner R32 2",
      status: "tbd",
    });
  });

  it("overlays fixtures by stage and kickoff order", () => {
    const rounds = buildBracket(
      [
        fixture({ api_fixture_id: 2, stage: "Round of 32", datetime_utc: "2026-06-28T20:00:00.000Z", home_team_id: 30, away_team_id: 40 }),
        fixture({ api_fixture_id: 1, stage: "Round of 32", datetime_utc: "2026-06-28T18:00:00.000Z", home_team_id: 10, away_team_id: 20 }),
      ],
      teams,
    );
    expect(rounds[0].matches[0]).toMatchObject({ slotId: "R32-1", fixtureId: 1, homeLabel: "Brazil" });
    expect(rounds[0].matches[1]).toMatchObject({ slotId: "R32-2", fixtureId: 2, awayLabel: "Argentina" });
  });

  it("maps semi-final winner and loser routes to final and third-place", () => {
    const rounds = buildBracket(
      [
        fixture({
          api_fixture_id: 50,
          stage: "Semi-finals",
          datetime_utc: "2026-07-14T18:00:00.000Z",
          home_team_id: 10,
          away_team_id: 20,
          status: "finished",
          home_score: 2,
          away_score: 1,
        }),
      ],
      teams,
    );
    expect(rounds[3].matches[0]).toMatchObject({
      slotId: "SF-1",
      winnerAdvancesTo: "F-1",
      loserAdvancesTo: "TP-1",
    });
  });

  it("derives confirmed R16 teams and possible opponents from round-of-32 feeders", () => {
    const rounds = buildBracket(
      [
        fixture({
          api_fixture_id: 101,
          stage: "Round of 32",
          datetime_utc: "2026-06-28T18:00:00.000Z",
          home_team_id: 50,
          away_team_id: 20,
          status: "finished",
          home_score: 2,
          away_score: 0,
        }),
        fixture({
          api_fixture_id: 102,
          stage: "Round of 32",
          datetime_utc: "2026-06-28T20:00:00.000Z",
          home_team_id: 10,
          away_team_id: 35,
          status: "scheduled",
          home_score: null,
          away_score: null,
        }),
      ],
      teams,
    );

    expect(rounds[1].matches[0]).toMatchObject({
      slotId: "R16-1",
      status: "tbd",
      homeTeamId: 50,
      homePossibleTeamIds: [],
      homeLabel: "Canada",
      awayTeamId: null,
      awayPossibleTeamIds: [10, 35],
      awayLabel: "Brazil / Japan",
    });
  });
});
