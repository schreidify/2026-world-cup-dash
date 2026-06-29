import type { ApiBracketRound, ApiBracketSlot } from "./api";

function didTeamAdvance(match: ApiBracketSlot, teamId: number): "winner" | "loser" | null {
  if (match.status !== "finished") return null;
  if (match.homeScore == null || match.awayScore == null) return null;
  if (match.homeScore === match.awayScore) return null;
  if (match.homeTeamId === teamId) return match.homeScore > match.awayScore ? "winner" : "loser";
  if (match.awayTeamId === teamId) return match.awayScore > match.homeScore ? "winner" : "loser";
  return null;
}

function followPath(matchById: Map<string, ApiBracketSlot>, startId: string | null, highlights: Set<string>): void {
  let current = startId;
  while (current) {
    if (highlights.has(current)) break;
    highlights.add(current);
    current = matchById.get(current)?.winnerAdvancesTo ?? null;
  }
}

export function getBracketHighlightSlotIds(rounds: ApiBracketRound[], favorites: number[]): Set<string> {
  const matchById = new Map<string, ApiBracketSlot>();
  const matches = rounds.flatMap((round) => round.matches);
  for (const match of matches) {
    matchById.set(match.slotId, match);
  }

  const highlights = new Set<string>();
  for (const teamId of favorites) {
    for (const match of matches) {
      const includesTeam = match.homeTeamId === teamId || match.awayTeamId === teamId;
      if (!includesTeam) continue;

      highlights.add(match.slotId);
      const outcome = didTeamAdvance(match, teamId);
      if (outcome === "winner") {
        followPath(matchById, match.winnerAdvancesTo, highlights);
      } else if (outcome === "loser") {
        followPath(matchById, match.loserAdvancesTo, highlights);
      } else {
        followPath(matchById, match.winnerAdvancesTo, highlights);
      }
    }
  }

  return highlights;
}
