import { describe, it, expect } from "vitest";
import { compareGroupStandings } from "../src/lib/standings";
import type { ApiStanding } from "../src/lib/api";

function standing(overrides: Partial<ApiStanding>): ApiStanding {
  return {
    group: "C",
    team_id: 1,
    played: 3,
    win: 0,
    loss: 0,
    draw: 0,
    gf: 0,
    ga: 0,
    gd: 0,
    points: 0,
    rank: 1,
    ...overrides,
  };
}

describe("compareGroupStandings", () => {
  it("sorts by points descending", () => {
    const higher = standing({ points: 7, gd: 3 });
    const lower = standing({ points: 3, gd: -3 });
    expect(compareGroupStandings(higher, lower)).toBeLessThan(0);
    expect(compareGroupStandings(lower, higher)).toBeGreaterThan(0);
  });

  it("uses goal difference as tiebreaker when points are equal", () => {
    const betterGd = standing({ points: 7, gd: 6 });
    const worseGd = standing({ points: 7, gd: 3 });
    expect(compareGroupStandings(betterGd, worseGd)).toBeLessThan(0);
    expect(compareGroupStandings(worseGd, betterGd)).toBeGreaterThan(0);
  });
});
