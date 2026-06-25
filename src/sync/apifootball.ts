const BASE = "https://v3.football.api-sports.io";

async function call(key: string, path: string): Promise<any> {
  const res = await fetch(`${BASE}${path}`, { headers: { "x-apisports-key": key } });
  if (!res.ok) throw new Error(`api-football ${path} returned ${res.status}`);
  const json = await res.json();
  if (json.errors && Object.keys(json.errors).length > 0) {
    throw new Error(`api-football ${path} errors: ${JSON.stringify(json.errors)}`);
  }
  return json;
}

export function fetchFixturesByDate(key: string, dateYmd: string) {
  return call(key, `/fixtures?league=1&season=2026&date=${dateYmd}`);
}

export function fetchStandings(key: string) {
  return call(key, `/standings?league=1&season=2026`);
}

export function fetchFixtureStatistics(key: string, fixtureId: number) {
  return call(key, `/fixtures/statistics?fixture=${fixtureId}`);
}

export function fetchPlayers(key: string, teamId: number) {
  return call(key, `/players?team=${teamId}&season=2026`);
}
