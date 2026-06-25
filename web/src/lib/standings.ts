import type { ApiStanding } from "./api";

/** FIFA group stage: points first, then goal difference. */
export function compareGroupStandings(a: ApiStanding, b: ApiStanding): number {
  if (b.points !== a.points) return b.points - a.points;
  return b.gd - a.gd;
}

export function standingKey(group: string, teamId: number): string {
  return `${group}:${teamId}`;
}

export function standingsByGroupAndTeam(standings: ApiStanding[]): Map<string, ApiStanding> {
  return new Map(standings.map((s) => [standingKey(s.group, s.team_id), s]));
}
