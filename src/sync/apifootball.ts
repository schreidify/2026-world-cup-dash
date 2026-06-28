const BASE = "https://v3.football.api-sports.io";

const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [1000, 2000, 4000];
const INTER_REQUEST_DELAY_MS = 250;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimitResponse(status: number, json: { errors?: Record<string, unknown> }): boolean {
  if (status === 429) return true;
  return json.errors?.rateLimit != null;
}

async function call(key: string, path: string): Promise<any> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(`${BASE}${path}`, { headers: { "x-apisports-key": key } });
    const json = await res.json();

    if (!res.ok) {
      lastError = new Error(`api-football ${path} returned ${res.status}`);
      if (res.status === 429 && attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAYS_MS[attempt] ?? 4000);
        continue;
      }
      throw lastError;
    }

    if (json.errors && Object.keys(json.errors).length > 0) {
      lastError = new Error(`api-football ${path} errors: ${JSON.stringify(json.errors)}`);
      if (isRateLimitResponse(res.status, json) && attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAYS_MS[attempt] ?? 4000);
        continue;
      }
      throw lastError;
    }

    await sleep(INTER_REQUEST_DELAY_MS);
    return json;
  }

  throw lastError ?? new Error(`api-football ${path} failed after retries`);
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
