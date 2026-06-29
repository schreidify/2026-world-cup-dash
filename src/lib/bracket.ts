import type { BracketRound, BracketSlot, Fixture, KnockoutStage, Team } from "../types";

interface BracketTemplateSlot {
  slotId: string;
  stage: KnockoutStage;
  order: number;
  label: string;
  homeSeed: string;
  awaySeed: string;
  winnerAdvancesTo: string | null;
  loserAdvancesTo: string | null;
}

const ROUND_META: Array<{ key: KnockoutStage; label: string; count: number }> = [
  { key: "round_of_32", label: "Round of 32", count: 16 },
  { key: "round_of_16", label: "Round of 16", count: 8 },
  { key: "quarter_final", label: "Quarter-finals", count: 4 },
  { key: "semi_final", label: "Semi-finals", count: 2 },
  { key: "third_place", label: "Third-place match", count: 1 },
  { key: "final", label: "Final", count: 1 },
];

const KNOCKOUT_LABELS: Record<KnockoutStage, string> = Object.fromEntries(
  ROUND_META.map((round) => [round.key, round.label]),
) as Record<KnockoutStage, string>;

function range(count: number): number[] {
  return Array.from({ length: count }, (_, index) => index + 1);
}

function makeTemplate(): BracketTemplateSlot[] {
  const roundOf32 = range(16).map((order) => ({
    slotId: `R32-${order}`,
    stage: "round_of_32" as const,
    order,
    label: `Round of 32 ${order}`,
    homeSeed: "TBD",
    awaySeed: "TBD",
    winnerAdvancesTo: `R16-${Math.ceil(order / 2)}`,
    loserAdvancesTo: null,
  }));
  const roundOf16 = range(8).map((order) => {
    const first = order * 2 - 1;
    const second = order * 2;
    return {
      slotId: `R16-${order}`,
      stage: "round_of_16" as const,
      order,
      label: `Round of 16 ${order}`,
      homeSeed: `Winner R32 ${first}`,
      awaySeed: `Winner R32 ${second}`,
      winnerAdvancesTo: `QF-${Math.ceil(order / 2)}`,
      loserAdvancesTo: null,
    };
  });
  const quarterFinals = range(4).map((order) => {
    const first = order * 2 - 1;
    const second = order * 2;
    return {
      slotId: `QF-${order}`,
      stage: "quarter_final" as const,
      order,
      label: `Quarter-final ${order}`,
      homeSeed: `Winner R16 ${first}`,
      awaySeed: `Winner R16 ${second}`,
      winnerAdvancesTo: `SF-${Math.ceil(order / 2)}`,
      loserAdvancesTo: null,
    };
  });
  const semiFinals = range(2).map((order) => {
    const first = order * 2 - 1;
    const second = order * 2;
    return {
      slotId: `SF-${order}`,
      stage: "semi_final" as const,
      order,
      label: `Semi-final ${order}`,
      homeSeed: `Winner QF ${first}`,
      awaySeed: `Winner QF ${second}`,
      winnerAdvancesTo: "F-1",
      loserAdvancesTo: "TP-1",
    };
  });
  const thirdPlace = [
    {
      slotId: "TP-1",
      stage: "third_place" as const,
      order: 1,
      label: "Third-place match",
      homeSeed: "Loser SF 1",
      awaySeed: "Loser SF 2",
      winnerAdvancesTo: null,
      loserAdvancesTo: null,
    },
  ];
  const final = [
    {
      slotId: "F-1",
      stage: "final" as const,
      order: 1,
      label: "Final",
      homeSeed: "Winner SF 1",
      awaySeed: "Winner SF 2",
      winnerAdvancesTo: null,
      loserAdvancesTo: null,
    },
  ];

  return [...roundOf32, ...roundOf16, ...quarterFinals, ...semiFinals, ...thirdPlace, ...final];
}

const BRACKET_TEMPLATE = makeTemplate();

export function knockoutStageLabel(stage: KnockoutStage): string {
  return KNOCKOUT_LABELS[stage];
}

export function getKnockoutStageOrder(): KnockoutStage[] {
  return ROUND_META.map((round) => round.key);
}

export function normalizeKnockoutStage(round: string | null | undefined): KnockoutStage | null {
  const value = round?.trim().toLowerCase();
  if (!value) return null;
  if (value.includes("round of 32")) return "round_of_32";
  if (value.includes("round of 16")) return "round_of_16";
  if (value.includes("quarter")) return "quarter_final";
  if (value.includes("semi")) return "semi_final";
  if (value.includes("3rd") || value.includes("third")) return "third_place";
  if (value === "final" || value.startsWith("final -")) return "final";
  return null;
}

function byStageAndTime(a: Fixture, b: Fixture): number {
  const time = a.datetime_utc.localeCompare(b.datetime_utc);
  if (time !== 0) return time;
  return a.api_fixture_id - b.api_fixture_id;
}

function defaultSeeds(slot: BracketTemplateSlot): Pick<BracketSlot, "homeLabel" | "awayLabel"> {
  return {
    homeLabel: slot.homeSeed,
    awayLabel: slot.awaySeed,
  };
}

export function buildBracket(fixtures: Fixture[], teams: Team[]): BracketRound[] {
  const teamById = new Map(teams.map((team) => [team.id, team]));
  const fixturesByStage = new Map<KnockoutStage, Fixture[]>();

  for (const fixture of fixtures) {
    const stage = normalizeKnockoutStage(fixture.stage);
    if (!stage) continue;
    const list = fixturesByStage.get(stage) ?? [];
    list.push(fixture);
    fixturesByStage.set(stage, list);
  }

  for (const list of fixturesByStage.values()) {
    list.sort(byStageAndTime);
  }

  return ROUND_META.map((round) => {
    const stageFixtures = fixturesByStage.get(round.key) ?? [];
    const matches = BRACKET_TEMPLATE.filter((slot) => slot.stage === round.key).map((slot, index) => {
      const fixture = stageFixtures[index] ?? null;
      const homeTeam = fixture?.home_team_id != null ? teamById.get(fixture.home_team_id) : null;
      const awayTeam = fixture?.away_team_id != null ? teamById.get(fixture.away_team_id) : null;
      const seeds = defaultSeeds(slot);

      return {
        slotId: slot.slotId,
        stage: slot.stage,
        order: slot.order,
        fixtureId: fixture?.api_fixture_id ?? null,
        datetimeUtc: fixture?.datetime_utc ?? null,
        status: fixture?.status ?? "tbd",
        homeTeamId: fixture?.home_team_id ?? null,
        awayTeamId: fixture?.away_team_id ?? null,
        homeLabel: homeTeam?.country ?? seeds.homeLabel,
        awayLabel: awayTeam?.country ?? seeds.awayLabel,
        homeScore: fixture?.home_score ?? null,
        awayScore: fixture?.away_score ?? null,
        winnerAdvancesTo: slot.winnerAdvancesTo,
        loserAdvancesTo: slot.loserAdvancesTo,
        venue: fixture?.venue ?? null,
        city: fixture?.city ?? null,
      } satisfies BracketSlot;
    });

    return {
      key: round.key,
      label: round.label,
      matches,
    };
  });
}
