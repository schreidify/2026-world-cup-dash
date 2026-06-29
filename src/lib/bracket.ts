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

function getStageSlots(stage: KnockoutStage): BracketTemplateSlot[] {
  return BRACKET_TEMPLATE.filter((slot) => slot.stage === stage);
}

function getFixtureWinnerTeamId(fixture: Fixture | null): number | null {
  if (!fixture || fixture.status !== "finished") return null;
  if (fixture.home_score == null || fixture.away_score == null) return null;
  if (fixture.home_score === fixture.away_score) return null;

  return fixture.home_score > fixture.away_score ? fixture.home_team_id : fixture.away_team_id;
}

function getFixtureTeamIds(fixture: Fixture | null): number[] {
  const ids = [fixture?.home_team_id ?? null, fixture?.away_team_id ?? null].filter((value): value is number => value != null);
  return Array.from(new Set(ids));
}

function getRoundOf16FeederSlotIds(slot: BracketTemplateSlot): { home: string; away: string } | null {
  if (slot.stage !== "round_of_16") return null;

  const first = slot.order * 2 - 1;
  return {
    home: `R32-${first}`,
    away: `R32-${first + 1}`,
  };
}

function joinTeamNames(teamIds: number[], teamById: Map<number, Team>, fallback: string): string {
  const labels = teamIds.map((teamId) => teamById.get(teamId)?.country).filter((value): value is string => Boolean(value));
  return labels.length > 0 ? labels.join(" / ") : fallback;
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

  const fixtureBySlotId = new Map<string, Fixture | null>();
  for (const round of ROUND_META) {
    const stageFixtures = fixturesByStage.get(round.key) ?? [];
    const stageSlots = getStageSlots(round.key);
    stageSlots.forEach((slot, index) => {
      fixtureBySlotId.set(slot.slotId, stageFixtures[index] ?? null);
    });
  }

  return ROUND_META.map((round) => {
    const matches = getStageSlots(round.key).map((slot) => {
      const fixture = fixtureBySlotId.get(slot.slotId) ?? null;
      const seeds = defaultSeeds(slot);
      let homeTeamId = fixture?.home_team_id ?? null;
      let awayTeamId = fixture?.away_team_id ?? null;
      let homePossibleTeamIds: number[] = [];
      let awayPossibleTeamIds: number[] = [];
      let homeLabel = homeTeamId != null ? (teamById.get(homeTeamId)?.country ?? seeds.homeLabel) : seeds.homeLabel;
      let awayLabel = awayTeamId != null ? (teamById.get(awayTeamId)?.country ?? seeds.awayLabel) : seeds.awayLabel;

      const feeders = getRoundOf16FeederSlotIds(slot);
      if (feeders) {
        if (homeTeamId == null) {
          const homeFeederFixture = fixtureBySlotId.get(feeders.home) ?? null;
          const winnerId = getFixtureWinnerTeamId(homeFeederFixture);
          if (winnerId != null) {
            homeTeamId = winnerId;
            homeLabel = teamById.get(winnerId)?.country ?? seeds.homeLabel;
          } else {
            homePossibleTeamIds = getFixtureTeamIds(homeFeederFixture);
            homeLabel = joinTeamNames(homePossibleTeamIds, teamById, seeds.homeLabel);
          }
        }

        if (awayTeamId == null) {
          const awayFeederFixture = fixtureBySlotId.get(feeders.away) ?? null;
          const winnerId = getFixtureWinnerTeamId(awayFeederFixture);
          if (winnerId != null) {
            awayTeamId = winnerId;
            awayLabel = teamById.get(winnerId)?.country ?? seeds.awayLabel;
          } else {
            awayPossibleTeamIds = getFixtureTeamIds(awayFeederFixture);
            awayLabel = joinTeamNames(awayPossibleTeamIds, teamById, seeds.awayLabel);
          }
        }
      }

      return {
        slotId: slot.slotId,
        stage: slot.stage,
        order: slot.order,
        fixtureId: fixture?.api_fixture_id ?? null,
        datetimeUtc: fixture?.datetime_utc ?? null,
        status: fixture?.status ?? "tbd",
        homeTeamId,
        awayTeamId,
        homePossibleTeamIds,
        awayPossibleTeamIds,
        homeLabel,
        awayLabel,
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
