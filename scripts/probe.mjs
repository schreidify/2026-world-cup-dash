import { writeFile, mkdir } from "node:fs/promises";

const KEY = process.env.APIFOOTBALL_KEY;
if (!KEY) {
  console.error("Set APIFOOTBALL_KEY in your shell before running.");
  process.exit(1);
}
const BASE = "https://v3.football.api-sports.io";
const headers = { "x-apisports-key": KEY };

function parseGroupLetter(groupLabel) {
  const match = /^Group ([A-L])$/i.exec(groupLabel ?? "");
  return match ? match[1].toUpperCase() : null;
}

function summarizeStandings(json) {
  const tables = json.response?.[0]?.league?.standings ?? [];
  const teams = new Map();
  for (const table of tables) {
    const group = parseGroupLetter(table[0]?.group);
    if (!group) continue;
    for (const row of table) teams.set(row.team.id, { name: row.team.name, group });
  }
  return { groupCount: new Set([...teams.values()].map((t) => t.group)).size, teamCount: teams.size };
}

function summarizeFixtures(json) {
  return (json.response ?? []).map((row) => {
    const home = row.teams.home.name;
    const away = row.teams.away.name;
    const status = row.fixture.status.short;
    return `${home} vs ${away} (${status})`;
  });
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`, { headers });
  const json = await res.json();
  console.log(`\n=== ${path} ===`);
  console.log("status:", res.status);
  console.log("errors:", JSON.stringify(json.errors));
  console.log("results:", json.results);
  console.log("X-RateLimit-Requests-Remaining:", res.headers.get("x-ratelimit-requests-remaining"));
  return json;
}

async function saveFixture(relativePath, json, summary) {
  await writeFile(relativePath, JSON.stringify(json, null, 2));
  console.log(`Wrote ${relativePath}${summary ? ` — ${summary}` : ""}`);
}

await mkdir("test/fixtures", { recursive: true });

const today = new Date().toISOString().slice(0, 10);
const fixtures = await get(`/fixtures?league=1&season=2026&date=${today}`);
const fixtureSummary = summarizeFixtures(fixtures);
await saveFixture("test/fixtures/fixtures-by-date.json", fixtures, `${fixtureSummary.length} fixtures on ${today}`);
for (const line of fixtureSummary) console.log(`  • ${line}`);

const standings = await get("/standings?league=1&season=2026");
const { groupCount, teamCount } = summarizeStandings(standings);
await saveFixture(
  "test/fixtures/standings.json",
  standings,
  `${teamCount} teams across ${groupCount} groups (results=${standings.results} is the league count, not team count)`,
);

const teams = await get("/teams?league=1&season=2026");
await saveFixture("test/fixtures/teams-by-league.json", teams, `${teams.results} teams in league roster`);

const countries = await get("/teams/countries");
await saveFixture("test/fixtures/teams-countries.json", countries, `${countries.results} countries for flag lookup`);

console.log("\nNext: node scripts/build-teams-2026.mjs");

const fixtureId = process.env.FIXTURE_ID;
if (fixtureId) {
  const stats = await get(`/fixtures/statistics?fixture=${fixtureId}`);
  await saveFixture("test/fixtures/match-stats.json", stats, `stats for fixture ${fixtureId}`);
} else {
  console.log("\n(skip match-stats: set FIXTURE_ID to a finished fixture to capture it)");
}

const teamId = process.env.TEAM_ID;
if (teamId) {
  const players = await get(`/players?team=${teamId}&season=2026`);
  await saveFixture("test/fixtures/players.json", players, `roster for team ${teamId}`);
} else {
  console.log("(skip players: set TEAM_ID to capture a roster)");
}
