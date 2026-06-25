import { readFile, writeFile } from "node:fs/promises";
import {
  flagForTeam,
  normalizeCountryKey,
  openfootballName,
} from "./country-aliases.mjs";

const STANDINGS_PATH = process.env.STANDINGS_PATH ?? "test/fixtures/standings.json";
const TEAMS_PATH = process.env.TEAMS_PATH ?? "test/fixtures/teams-by-league.json";
const COUNTRIES_PATH = process.env.COUNTRIES_PATH ?? "test/fixtures/teams-countries.json";
const OUT_PATH = process.env.OUT_PATH ?? "test/fixtures/teams-2026.json";

function parseGroupLetter(groupLabel) {
  const match = /^Group ([A-L])$/i.exec(groupLabel ?? "");
  return match ? match[1].toUpperCase() : null;
}

function teamsFromStandings(standingsJson) {
  const tables = standingsJson.response?.[0]?.league?.standings ?? [];
  const byId = new Map();

  for (const table of tables) {
    const group = parseGroupLetter(table[0]?.group);
    if (!group) continue;

    for (const row of table) {
      byId.set(row.team.id, {
        id: row.team.id,
        country: row.team.name,
        group,
      });
    }
  }

  return byId;
}

function teamsByIdFromLeague(teamsJson) {
  const map = new Map();
  for (const row of teamsJson.response ?? []) {
    map.set(row.team.id, row.team);
  }
  return map;
}

function countriesByKey(countriesJson) {
  const map = new Map();
  for (const country of countriesJson.response ?? []) {
    map.set(normalizeCountryKey(country.name), country);
  }
  return map;
}

const standings = JSON.parse(await readFile(STANDINGS_PATH, "utf8"));
const teamsByLeague = JSON.parse(await readFile(TEAMS_PATH, "utf8"));
const countries = JSON.parse(await readFile(COUNTRIES_PATH, "utf8"));

const fromStandings = teamsFromStandings(standings);
const leagueTeams = teamsByIdFromLeague(teamsByLeague);
const countriesByName = countriesByKey(countries);

const teams = [...fromStandings.values()]
  .map(({ id, country, group }) => {
    const meta = leagueTeams.get(id);
    const fifa_code = meta?.code ?? null;
    const history_country = openfootballName(country);
    const flag = flagForTeam(country, fifa_code, countriesByName);

    return {
      id,
      country,
      history_country: history_country === country ? undefined : history_country,
      group,
      fifa_code,
      flag,
    };
  })
  .map((team) => {
    if (team.history_country === undefined) delete team.history_country;
    return team;
  })
  .sort((a, b) => a.group.localeCompare(b.group) || a.country.localeCompare(b.country));

const missingMeta = teams.filter((t) => !t.fifa_code);
const missingFlags = teams.filter((t) => !t.flag);

await writeFile(OUT_PATH, JSON.stringify(teams, null, 2) + "\n");

console.log(`Wrote ${OUT_PATH} with ${teams.length} teams`);
if (missingMeta.length) {
  console.warn(`Warning: ${missingMeta.length} teams missing fifa_code:`, missingMeta.map((t) => t.country).join(", "));
}
if (missingFlags.length) {
  console.warn(`Warning: ${missingFlags.length} teams missing flag:`, missingFlags.map((t) => t.country).join(", "));
}
