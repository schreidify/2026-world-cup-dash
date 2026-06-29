export type FixtureStatus = "scheduled" | "live" | "finished";
export type BracketSlotStatus = FixtureStatus | "tbd";
export type KnockoutStage =
  | "round_of_32"
  | "round_of_16"
  | "quarter_final"
  | "semi_final"
  | "third_place"
  | "final";

export interface Team {
  id: number;
  country: string;
  group: string | null;
  flag: string | null;
  fifa_code: string | null;
  appearances_since_1930: number;
  last_appearance: number | null;
  wins_since_1930: number;
}

export interface Fixture {
  api_fixture_id: number;
  stage: string;
  group: string | null;
  datetime_utc: string;
  venue: string | null;
  city: string | null;
  home_team_id: number | null;
  away_team_id: number | null;
  status: FixtureStatus;
  elapsed_minute: number | null;
  home_score: number | null;
  away_score: number | null;
  streaming_channel: string | null;
}

export interface Standing {
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

export interface MatchStat {
  fixture_id: number;
  team_id: number;
  goals: number;
  fouls: number;
  yellow_cards: number;
  red_cards: number;
  shots: number;
  shots_on_target: number;
}

export interface Player {
  team_id: number;
  name: string;
  position: string | null;
  shirt_number: number | null;
}

export interface BracketSlot {
  slotId: string;
  stage: KnockoutStage;
  order: number;
  fixtureId: number | null;
  datetimeUtc: string | null;
  status: BracketSlotStatus;
  homeTeamId: number | null;
  awayTeamId: number | null;
  homePossibleTeamIds: number[];
  awayPossibleTeamIds: number[];
  homeLabel: string;
  awayLabel: string;
  homeScore: number | null;
  awayScore: number | null;
  winnerAdvancesTo: string | null;
  loserAdvancesTo: string | null;
  venue: string | null;
  city: string | null;
}

export interface BracketRound {
  key: KnockoutStage;
  label: string;
  matches: BracketSlot[];
}
