import { describe, it, expect } from "vitest";
import { aggregateHistory } from "../src/sync/openfootball";

const t1930 = {
  rounds: [
    { name: "Final", matches: [{ team1: { name: "Uruguay" }, team2: { name: "Argentina" }, score: { ft: [4, 2] } }] },
    { name: "Group 1", matches: [{ team1: { name: "Uruguay" }, team2: { name: "Peru" }, score: { ft: [1, 0] } }] },
  ],
};
const t1934 = {
  rounds: [
    { name: "Final", matches: [{ team1: { name: "Italy" }, team2: { name: "Czechoslovakia" }, score: { ft: [2, 1] } }] },
  ],
};

describe("aggregateHistory", () => {
  it("counts appearances per country across tournaments", () => {
    const map = aggregateHistory([{ year: 1930, data: t1930 }, { year: 1934, data: t1934 }]);
    expect(map["Uruguay"].appearances_since_1930).toBe(1);
    expect(map["Italy"].appearances_since_1930).toBe(1);
    expect(map["Peru"].appearances_since_1930).toBe(1);
  });

  it("records the most recent appearance year", () => {
    const map = aggregateHistory([{ year: 1930, data: t1930 }, { year: 1934, data: t1934 }]);
    expect(map["Uruguay"].last_appearance).toBe(1930);
    expect(map["Italy"].last_appearance).toBe(1934);
  });

  it("counts wins from the Final round only", () => {
    const map = aggregateHistory([{ year: 1930, data: t1930 }, { year: 1934, data: t1934 }]);
    expect(map["Uruguay"].wins_since_1930).toBe(1);
    expect(map["Argentina"].wins_since_1930).toBe(0);
    expect(map["Italy"].wins_since_1930).toBe(1);
  });
});
