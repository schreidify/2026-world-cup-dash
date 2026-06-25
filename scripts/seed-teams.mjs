import { readFile, writeFile } from "node:fs/promises";
import { aggregateHistory } from "../src/sync/openfootball.ts";

const YEARS = [
  1930, 1934, 1938, 1950, 1954, 1958, 1962, 1966, 1970, 1974, 1978, 1982, 1986, 1990, 1994, 1998, 2002, 2006, 2010,
  2014, 2018, 2022,
];

async function loadTournament(year) {
  const url = `https://raw.githubusercontent.com/openfootball/worldcup.json/master/${year}/worldcup.json`;
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`skip ${year}: ${res.status}`);
    return null;
  }
  return { year, data: await res.json() };
}

const tournaments = (await Promise.all(YEARS.map(loadTournament))).filter(Boolean);
const history = aggregateHistory(tournaments);

const teams = JSON.parse(await readFile("test/fixtures/teams-2026.json", "utf8"));

const escape = (s) => (s == null ? "NULL" : `'${String(s).replace(/'/g, "''")}'`);
const lines = teams.map((t) => {
  const historyKey = t.history_country ?? t.country;
  const h = history[historyKey] ?? { appearances_since_1930: 0, last_appearance: null, wins_since_1930: 0 };
  return (
    `INSERT INTO teams (id, country, "group", flag, fifa_code, appearances_since_1930, last_appearance, wins_since_1930) ` +
    `VALUES (${t.id}, ${escape(t.country)}, ${escape(t.group)}, ${escape(t.flag)}, ${escape(t.fifa_code)}, ` +
    `${h.appearances_since_1930}, ${h.last_appearance ?? "NULL"}, ${h.wins_since_1930}) ` +
    `ON CONFLICT(id) DO UPDATE SET appearances_since_1930=excluded.appearances_since_1930, ` +
    `last_appearance=excluded.last_appearance, wins_since_1930=excluded.wins_since_1930, ` +
    `"group"=excluded."group", flag=excluded.flag, fifa_code=excluded.fifa_code;`
  );
});
await writeFile("seed-teams.sql", lines.join("\n") + "\n");
console.log(`Wrote seed-teams.sql with ${lines.length} teams`);
