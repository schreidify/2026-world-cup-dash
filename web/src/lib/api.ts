export interface ApiFixture {
  api_fixture_id: number;
  stage: string;
  group: string | null;
  datetime_utc: string;
  venue: string | null;
  city: string | null;
  home_team_id: number | null;
  away_team_id: number | null;
  status: "scheduled" | "live" | "finished";
  elapsed_minute: number | null;
  home_score: number | null;
  away_score: number | null;
  streaming_channel: string | null;
}

export type ApiBracketStage =
  | "round_of_32"
  | "round_of_16"
  | "quarter_final"
  | "semi_final"
  | "third_place"
  | "final";

export type ApiBracketStatus = ApiFixture["status"] | "tbd";

export interface ApiBracketSlot {
  slotId: string;
  stage: ApiBracketStage;
  order: number;
  fixtureId: number | null;
  datetimeUtc: string | null;
  status: ApiBracketStatus;
  homeTeamId: number | null;
  awayTeamId: number | null;
  homeLabel: string;
  awayLabel: string;
  homeScore: number | null;
  awayScore: number | null;
  winnerAdvancesTo: string | null;
  loserAdvancesTo: string | null;
  venue: string | null;
  city: string | null;
}

export interface ApiBracketRound {
  key: ApiBracketStage;
  label: string;
  matches: ApiBracketSlot[];
}

export interface ApiStanding {
  group: string;
  team_id: number;
  played: number;
  win: number;
  loss: number;
  draw: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  rank: number;
}

export interface ApiTeam {
  id: number;
  country: string;
  group: string | null;
  flag: string | null;
  fifa_code: string | null;
  appearances_since_1930: number;
  last_appearance: number | null;
  wins_since_1930: number;
}

export interface ApiPlayer {
  team_id: number;
  name: string;
  position: string | null;
  shirt_number: number | null;
}

export interface TeamDetail {
  standing: ApiStanding | null;
  nextGame: ApiFixture | null;
  roster: ApiPlayer[];
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path} returned ${res.status}`);
  return res.json() as Promise<T>;
}

async function postJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { method: "POST" });
  if (!res.ok) throw new Error(`${path} returned ${res.status}`);
  return res.json() as Promise<T>;
}

export const fetchToday = (tz: string) =>
  getJson<{ fixtures: ApiFixture[]; dataAsOf: string | null }>(`/api/today?tz=${encodeURIComponent(tz)}`);
export const fetchTomorrow = (tz: string) =>
  getJson<{ fixtures: ApiFixture[]; dataAsOf: string | null }>(`/api/tomorrow?tz=${encodeURIComponent(tz)}`);
export const fetchStandings = () => getJson<{ standings: ApiStanding[] }>("/api/standings");
export const fetchGroupStandings = () => getJson<{ standings: ApiStanding[] }>("/api/standings/groups");
export const fetchBracket = () => getJson<{ rounds: ApiBracketRound[]; dataAsOf: string | null }>("/api/bracket");
export const fetchTeams = () => getJson<{ teams: ApiTeam[] }>("/api/teams");
export const fetchRoster = (teamId: number) => getJson<{ players: ApiPlayer[] }>(`/api/teams/${teamId}/roster`);
export const fetchTeamDetail = (teamId: number) => getJson<TeamDetail>(`/api/teams/${teamId}/detail`);
export const triggerSync = () =>
  postJson<{ ok: boolean; dataAsOf: string | null; requestsUsed?: number; skipped?: boolean; reason?: string }>("/api/sync");
