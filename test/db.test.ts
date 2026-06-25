import { describe, it, expect, beforeEach } from "vitest";
import { env } from "cloudflare:test";
import { upsertFixtures, getTodaysFixtures } from "../src/db/queries";
import type { Fixture } from "../src/types";

const sample: Fixture = {
  api_fixture_id: 100,
  stage: "Group Stage",
  group: "A",
  datetime_utc: new Date().toISOString(),
  venue: "MetLife",
  city: "East Rutherford",
  home_team_id: 10,
  away_team_id: 20,
  status: "scheduled",
  elapsed_minute: null,
  home_score: null,
  away_score: null,
  streaming_channel: null,
};

beforeEach(async () => {
  await env.DB.exec("DELETE FROM fixtures");
});

describe("fixtures queries", () => {
  it("upserts and reads back today's fixtures", async () => {
    await upsertFixtures(env.DB, [sample]);
    const rows = await getTodaysFixtures(env.DB, new Date().toISOString().slice(0, 10));
    expect(rows.length).toBe(1);
    expect(rows[0].api_fixture_id).toBe(100);
  });

  it("upsert overwrites an existing fixture (live update)", async () => {
    await upsertFixtures(env.DB, [sample]);
    await upsertFixtures(env.DB, [
      { ...sample, status: "live", elapsed_minute: 67, home_score: 1, away_score: 0 },
    ]);
    const rows = await getTodaysFixtures(env.DB, new Date().toISOString().slice(0, 10));
    expect(rows.length).toBe(1);
    expect(rows[0].status).toBe("live");
    expect(rows[0].home_score).toBe(1);
  });
});
