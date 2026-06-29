import type { ApiBracketRound, ApiBracketSlot, ApiBracketStage, ApiTeam } from "../lib/api";
import { formatInZone } from "../lib/timezone";
import { getBracketHighlightSlotIds } from "../lib/bracket";
import { TeamHoverCard } from "./TeamHoverCard";

interface Props {
  rounds: ApiBracketRound[];
  teams: Record<number, ApiTeam>;
  timezone: string;
  favorites: number[];
  onToggleFavorite: (teamId: number) => void;
}

const STAGE_ORDER: Exclude<ApiBracketStage, "third_place" | "final">[] = [
  "round_of_32",
  "round_of_16",
  "quarter_final",
  "semi_final",
];

const STAGE_LABELS: Record<ApiBracketStage, string> = {
  round_of_32: "Round of 32",
  round_of_16: "Round of 16",
  quarter_final: "Quarter-finals",
  semi_final: "Semi-finals",
  third_place: "Third-place match",
  final: "Final",
};

const SIDE_SPLIT_ORDER: Record<Exclude<ApiBracketStage, "third_place" | "final">, number> = {
  round_of_32: 8,
  round_of_16: 4,
  quarter_final: 2,
  semi_final: 1,
};

const SIDE_MATCH_COUNTS: Record<Exclude<ApiBracketStage, "third_place" | "final">, number> = {
  round_of_32: 8,
  round_of_16: 4,
  quarter_final: 2,
  semi_final: 1,
};

const ANIMATION_STEP_BY_STAGE: Record<Exclude<ApiBracketStage, "third_place" | "final">, number> = {
  round_of_32: 0,
  round_of_16: 1,
  quarter_final: 2,
  semi_final: 3,
};

const BRACKET_CARD_HEIGHT_REM = 9.5;
const BRACKET_ROW_GAP_REM = 1.5;
const BRACKET_ROW_PITCH_REM = BRACKET_CARD_HEIGHT_REM + BRACKET_ROW_GAP_REM;
const BRACKET_CARD_CENTER_REM = BRACKET_CARD_HEIGHT_REM / 2;
const BRACKET_GUTTER_HALF_REM = 0.5;
const SIDE_BOARD_HEIGHT_REM =
  SIDE_MATCH_COUNTS.round_of_32 * BRACKET_CARD_HEIGHT_REM +
  (SIDE_MATCH_COUNTS.round_of_32 - 1) * BRACKET_ROW_GAP_REM;

interface PositionedMatch {
  match: ApiBracketSlot;
  localOrder: number;
}

interface ColumnSpec {
  id: string;
  stage: Exclude<ApiBracketStage, "third_place" | "final">;
  label: string;
  side: "left" | "right";
  matches: PositionedMatch[];
}

interface ConnectorSegment {
  key: string;
  top: number;
  left?: string;
  right?: string;
  width?: string;
  height?: string;
}

function TeamLabel({
  label,
  team,
  emphasized,
  isFavorite,
  onToggleFavorite,
}: {
  label: string;
  team: ApiTeam | null;
  emphasized: boolean;
  isFavorite: boolean;
  onToggleFavorite: (teamId: number) => void;
}) {
  return (
    <span className={`flex min-w-0 items-center gap-2 ${emphasized ? "text-navy" : "text-slate-700"}`}>
      {team?.flag && (
        <TeamHoverCard team={team} isFavorite={isFavorite} onToggleFavorite={onToggleFavorite}>
          <span className="inline-flex" data-testid={`bracket-team-flag-${team.id}`}>
            <img src={team.flag} alt="" className="h-4 w-6 rounded-sm object-cover" />
          </span>
        </TeamHoverCard>
      )}
      <span className="truncate">{team?.country ?? label}</span>
    </span>
  );
}

function MatchCard({
  match,
  teams,
  timezone,
  favorites,
  highlighted,
  hasHighlights,
  onToggleFavorite,
}: {
  match: ApiBracketSlot;
  teams: Record<number, ApiTeam>;
  timezone: string;
  favorites: number[];
  highlighted: Set<string>;
  hasHighlights: boolean;
  onToggleFavorite: (teamId: number) => void;
}) {
  const isHighlighted = highlighted.has(match.slotId);
  const isDimmed = hasHighlights && !isHighlighted;
  const homeTeam = match.homeTeamId != null ? teams[match.homeTeamId] ?? null : null;
  const awayTeam = match.awayTeamId != null ? teams[match.awayTeamId] ?? null : null;

  return (
    <article
      data-testid={`bracket-slot-${match.slotId}`}
      className={`flex h-full flex-col overflow-hidden rounded-2xl border p-3 transition ${
        isHighlighted
          ? "border-accent bg-accent/10 shadow-[0_0_0_2px_rgba(22,163,74,0.15)]"
          : "border-slate-200 bg-slate-50"
      } ${isDimmed ? "opacity-45" : "opacity-100"}`}
    >
      <div className="mb-2 flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        <span>{match.slotId}</span>
        {match.status === "live" && <span className="rounded-full bg-accent/15 px-2 py-0.5 text-accent">Live</span>}
        {match.status === "finished" && <span>Final</span>}
        {match.status === "tbd" && <span>TBD</span>}
        {match.status === "scheduled" && match.datetimeUtc && <span>{formatInZone(match.datetimeUtc, timezone)}</span>}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <TeamLabel
            label={match.homeLabel}
            team={homeTeam}
            emphasized={match.homeTeamId != null && favorites.includes(match.homeTeamId)}
            isFavorite={match.homeTeamId != null && favorites.includes(match.homeTeamId)}
            onToggleFavorite={onToggleFavorite}
          />
          {match.status !== "tbd" && (
            <span className="text-lg font-bold tabular-nums text-navy">{match.homeScore ?? "—"}</span>
          )}
        </div>
        <div className="flex items-center justify-between gap-3">
          <TeamLabel
            label={match.awayLabel}
            team={awayTeam}
            emphasized={match.awayTeamId != null && favorites.includes(match.awayTeamId)}
            isFavorite={match.awayTeamId != null && favorites.includes(match.awayTeamId)}
            onToggleFavorite={onToggleFavorite}
          />
          {match.status !== "tbd" && (
            <span className="text-lg font-bold tabular-nums text-navy">{match.awayScore ?? "—"}</span>
          )}
        </div>
      </div>

      {(match.venue || match.city || (match.status === "scheduled" && match.datetimeUtc)) && (
        <div className="mt-auto min-h-10 pt-3 text-xs text-slate-400">
          {match.status === "scheduled" && match.datetimeUtc && <div>{formatInZone(match.datetimeUtc, timezone)}</div>}
          {(match.venue || match.city) && (
            <div>
              {match.venue ?? ""}
              {match.city ? `, ${match.city}` : ""}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function splitMatchesBySide(
  stage: Exclude<ApiBracketStage, "third_place" | "final">,
  matches: ApiBracketSlot[],
  side: "left" | "right",
): PositionedMatch[] {
  const threshold = SIDE_SPLIT_ORDER[stage];
  return matches
    .filter((match) => (side === "left" ? match.order <= threshold : match.order > threshold))
    .map((match) => ({
      match,
      localOrder: side === "left" ? match.order : match.order - threshold,
    }));
}

function getMatchTop(stage: Exclude<ApiBracketStage, "third_place" | "final">, localOrder: number): number {
  const stageIndex = STAGE_ORDER.indexOf(stage);
  const feederWindow = 2 ** stageIndex;
  const offset = feederWindow * (localOrder - 1) + (feederWindow - 1) / 2;
  return offset * BRACKET_ROW_PITCH_REM;
}

function getMatchCenter(stage: Exclude<ApiBracketStage, "third_place" | "final">, localOrder: number): number {
  return getMatchTop(stage, localOrder) + BRACKET_CARD_CENTER_REM;
}

function getConnectorTargetCenter(
  stage: Exclude<ApiBracketStage, "third_place" | "final">,
  localOrder: number,
  finalTop: number,
): number | null {
  if (stage === "semi_final") {
    return finalTop + BRACKET_CARD_CENTER_REM;
  }

  const stageIndex = STAGE_ORDER.indexOf(stage);
  const nextStage = STAGE_ORDER[stageIndex + 1];
  if (!nextStage) return null;
  return getMatchCenter(nextStage, Math.ceil(localOrder / 2));
}

function getIncomingConnectorSegments(
  stage: Exclude<ApiBracketStage, "third_place" | "final">,
  side: "left" | "right",
  matches: PositionedMatch[],
): ConnectorSegment[] {
  if (stage === "round_of_32") return [];

  return matches.map(({ match, localOrder }) => ({
    key: `incoming-${match.slotId}`,
    top: getMatchCenter(stage, localOrder),
    [side === "left" ? "left" : "right"]: `-${BRACKET_GUTTER_HALF_REM}rem`,
    width: `${BRACKET_GUTTER_HALF_REM}rem`,
  }));
}

function getOutgoingConnectorSegments(
  stage: Exclude<ApiBracketStage, "third_place" | "final">,
  side: "left" | "right",
  matches: PositionedMatch[],
  finalTop: number,
): ConnectorSegment[] {
  return matches.flatMap(({ match, localOrder }) => {
    const sourceCenter = getMatchCenter(stage, localOrder);
    const targetCenter = getConnectorTargetCenter(stage, localOrder, finalTop);
    if (targetCenter == null) return [];

    const top = Math.min(sourceCenter, targetCenter);
    const height = Math.abs(targetCenter - sourceCenter);

    return [
      {
        key: `outgoing-horizontal-${match.slotId}`,
        top: sourceCenter,
        [side === "left" ? "right" : "left"]: `-${BRACKET_GUTTER_HALF_REM}rem`,
        width: `${BRACKET_GUTTER_HALF_REM}rem`,
      },
      {
        key: `outgoing-vertical-${match.slotId}`,
        top,
        [side === "left" ? "right" : "left"]: `-${BRACKET_GUTTER_HALF_REM}rem`,
        height: `${height}rem`,
      },
    ];
  });
}

function StageBadge({
  label,
  count,
  top,
}: {
  label: string;
  count: number;
  top: number;
}) {
  return (
    <div className="absolute inset-x-0 flex items-center justify-between gap-3" style={{ top: `${top}rem` }}>
      <h4 className="text-sm font-bold uppercase tracking-wide text-slate-500">{label}</h4>
      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">{count}</span>
    </div>
  );
}

function RoundColumn({
  column,
  teams,
  timezone,
  favorites,
  highlighted,
  hasHighlights,
  finalTop,
  onToggleFavorite,
}: {
  column: ColumnSpec;
  teams: Record<number, ApiTeam>;
  timezone: string;
  favorites: number[];
  highlighted: Set<string>;
  hasHighlights: boolean;
  finalTop: number;
  onToggleFavorite: (teamId: number) => void;
}) {
  const incomingSegments = getIncomingConnectorSegments(column.stage, column.side, column.matches);
  const outgoingSegments = getOutgoingConnectorSegments(column.stage, column.side, column.matches, finalTop);

  return (
    <div
      className={`bracket-enter-${column.side} w-[15rem] shrink-0`}
      data-testid={`bracket-column-${column.side}-${column.stage}`}
      style={{ animationDelay: `${ANIMATION_STEP_BY_STAGE[column.stage] * 90}ms` }}
    >
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-bold uppercase tracking-wide text-slate-500">{column.label}</h4>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
          {column.matches.length}
        </span>
      </div>

      <div className="relative" style={{ height: `${SIDE_BOARD_HEIGHT_REM}rem` }}>
        {incomingSegments.map((segment) => (
          <div
            key={segment.key}
            aria-hidden="true"
            data-testid={`bracket-connector-${segment.key}`}
            className="absolute z-0 h-px bg-slate-300"
            style={{
              top: `${segment.top}rem`,
              left: segment.left,
              right: segment.right,
              width: segment.width,
            }}
          />
        ))}
        {outgoingSegments.map((segment) => (
          <div
            key={segment.key}
            aria-hidden="true"
            data-testid={`bracket-connector-${segment.key}`}
            className={`absolute z-0 bg-slate-300 ${segment.height ? "w-px" : "h-px"}`}
            style={{
              top: `${segment.top}rem`,
              left: segment.left,
              right: segment.right,
              width: segment.width,
              height: segment.height,
            }}
          />
        ))}
        {column.matches.map(({ match, localOrder }) => (
          <div
            key={match.slotId}
            className="absolute inset-x-0 z-10"
            data-testid={`bracket-slot-wrap-${match.slotId}`}
            style={{ top: `${getMatchTop(column.stage, localOrder)}rem`, height: `${BRACKET_CARD_HEIGHT_REM}rem` }}
          >
            <MatchCard
              match={match}
              teams={teams}
              timezone={timezone}
              favorites={favorites}
              highlighted={highlighted}
              hasHighlights={hasHighlights}
              onToggleFavorite={onToggleFavorite}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function Bracket({ rounds, teams, timezone, favorites, onToggleFavorite }: Props) {
  const highlighted = getBracketHighlightSlotIds(rounds, favorites);
  const hasHighlights = highlighted.size > 0;
  const roundsByKey = new Map(rounds.map((round) => [round.key, round]));

  const leftColumns: ColumnSpec[] = STAGE_ORDER.map((stage) => {
    const round = roundsByKey.get(stage);
    return {
      id: `left-${stage}`,
      stage,
      label: round?.label ?? STAGE_LABELS[stage],
      side: "left",
      matches: splitMatchesBySide(stage, round?.matches ?? [], "left"),
    };
  });

  const rightColumns: ColumnSpec[] = [...STAGE_ORDER].reverse().map((stage) => {
    const round = roundsByKey.get(stage);
    return {
      id: `right-${stage}`,
      stage,
      label: round?.label ?? STAGE_LABELS[stage],
      side: "right",
      matches: splitMatchesBySide(stage, round?.matches ?? [], "right"),
    };
  });

  const finalRound = roundsByKey.get("final");
  const thirdPlaceRound = roundsByKey.get("third_place");
  const finalTop = getMatchTop("semi_final", 1);
  const thirdPlaceTop = getMatchTop("quarter_final", 2);

  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#1e3a5f_55%,#f0f7ff_100%)] px-5 py-5 text-white">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-xl font-semibold tracking-tight">Knockout Bracket</h3>
            <p className="mt-1 max-w-2xl text-sm text-slate-200">
              The full path to the trophy, with your favorite teams highlighted when they are in the field.
            </p>
          </div>
          <div className="hidden rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-100 md:block">
            Tournament Remainder
          </div>
        </div>
      </div>

      <div className="overflow-x-auto px-4 py-5">
        <div className="flex min-w-max items-start gap-4 pb-2">
          {leftColumns.map((column) => (
            <RoundColumn
              key={column.id}
              column={column}
              teams={teams}
              timezone={timezone}
              favorites={favorites}
              highlighted={highlighted}
              hasHighlights={hasHighlights}
              finalTop={finalTop}
              onToggleFavorite={onToggleFavorite}
            />
          ))}

          <div
            className="bracket-enter-center w-[17rem] shrink-0"
            data-testid="bracket-column-center"
            style={{ animationDelay: "360ms" }}
          >
            <div className="relative" style={{ height: `${SIDE_BOARD_HEIGHT_REM}rem` }}>
              <StageBadge
                label={finalRound?.label ?? STAGE_LABELS.final}
                count={finalRound?.matches.length ?? 0}
                top={Math.max(0, finalTop - 2.5)}
              />
              <div
                aria-hidden="true"
                data-testid="bracket-connector-incoming-final-left"
                className="absolute z-0 h-px bg-slate-300"
                style={{
                  top: `${finalTop + BRACKET_CARD_CENTER_REM}rem`,
                  left: `-${BRACKET_GUTTER_HALF_REM}rem`,
                  width: `${BRACKET_GUTTER_HALF_REM}rem`,
                }}
              />
              <div
                aria-hidden="true"
                data-testid="bracket-connector-incoming-final-right"
                className="absolute z-0 h-px bg-slate-300"
                style={{
                  top: `${finalTop + BRACKET_CARD_CENTER_REM}rem`,
                  right: `-${BRACKET_GUTTER_HALF_REM}rem`,
                  width: `${BRACKET_GUTTER_HALF_REM}rem`,
                }}
              />
              {(finalRound?.matches ?? []).map((match) => (
                <div
                  key={match.slotId}
                  className="absolute inset-x-0 z-10"
                  data-testid={`bracket-slot-wrap-${match.slotId}`}
                  style={{ top: `${finalTop}rem`, height: `${BRACKET_CARD_HEIGHT_REM}rem` }}
                >
                  <MatchCard
                    match={match}
                    teams={teams}
                    timezone={timezone}
                    favorites={favorites}
                    highlighted={highlighted}
                    hasHighlights={hasHighlights}
                    onToggleFavorite={onToggleFavorite}
                  />
                </div>
              ))}

              <StageBadge
                label={thirdPlaceRound?.label ?? STAGE_LABELS.third_place}
                count={thirdPlaceRound?.matches.length ?? 0}
                top={Math.max(0, thirdPlaceTop - 2.5)}
              />
              {(thirdPlaceRound?.matches ?? []).map((match) => (
                <div
                  key={match.slotId}
                  className="absolute inset-x-0 z-10"
                  data-testid={`bracket-slot-wrap-${match.slotId}`}
                  style={{ top: `${thirdPlaceTop}rem`, height: `${BRACKET_CARD_HEIGHT_REM}rem` }}
                >
                  <MatchCard
                    match={match}
                    teams={teams}
                    timezone={timezone}
                    favorites={favorites}
                    highlighted={highlighted}
                    hasHighlights={hasHighlights}
                    onToggleFavorite={onToggleFavorite}
                  />
                </div>
              ))}
            </div>
          </div>

          {rightColumns.map((column) => (
            <RoundColumn
              key={column.id}
              column={column}
              teams={teams}
              timezone={timezone}
              favorites={favorites}
              highlighted={highlighted}
              hasHighlights={hasHighlights}
              finalTop={finalTop}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
