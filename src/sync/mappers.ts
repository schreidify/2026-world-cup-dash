import type { Fixture, FixtureStatus, Standing, MatchStat, Player } from "../types";

function mapStatus(short: string): FixtureStatus {
  if (["FT", "AET", "PEN"].includes(short)) return "finished";
  if (["1H", "2H", "HT", "ET", "BT", "P", "LIVE"].includes(short)) return "live";
  return "scheduled";
}

function parseGroup(round: string): string | null {
  const m = round.match(/Group ([A-L])/i);
  return m ? m[1].toUpperCase() : null;
}

export function mapFixtures(payload: { response: any[] }): Fixture[] {
  return payload.response.map((item) => {
    const short = item.fixture.status.short as string;
    const status = mapStatus(short);
    return {
      api_fixture_id: item.fixture.id,
      stage: item.league.round ?? "",
      group: parseGroup(item.league.round ?? ""),
      datetime_utc: new Date(item.fixture.date).toISOString(),
      venue: item.fixture.venue?.name ?? null,
      city: item.fixture.venue?.city ?? null,
      home_team_id: item.teams.home.id,
      away_team_id: item.teams.away.id,
      status,
      elapsed_minute: status === "live" ? (item.fixture.status.elapsed ?? null) : null,
      home_score: item.goals.home ?? null,
      away_score: item.goals.away ?? null,
      streaming_channel: null,
    };
  });
}

function normalizeGroup(g: string): string | null {
  const m = g.match(/Group ([A-L])/i);
  return m ? m[1].toUpperCase() : null;
}

export function mapStandings(payload: { response: any[] }): Standing[] {
  const out: Standing[] = [];
  for (const league of payload.response) {
    for (const groupArr of league.league.standings) {
      for (const row of groupArr) {
        const group = normalizeGroup(row.group);
        if (!group) continue;
        out.push({
          group,
          team_id: row.team.id,
          played: row.all.played,
          win: row.all.win,
          loss: row.all.lose,
          draw: row.all.draw,
          gf: row.all.goals.for,
          ga: row.all.goals.against,
          gd: row.goalsDiff,
          points: row.points,
          rank: row.rank,
        });
      }
    }
  }
  return out;
}

function stat(statistics: any[], type: string): number {
  const found = statistics.find((s) => s.type === type);
  const v = found?.value;
  if (v === null || v === undefined) return 0;
  if (typeof v === "string") return parseInt(v, 10) || 0;
  return v;
}

export function mapMatchStats(
  payload: { response: any[] },
  fixtureId: number,
  goalsByTeam: Record<number, number>,
): MatchStat[] {
  return payload.response.map((entry) => ({
    fixture_id: fixtureId,
    team_id: entry.team.id,
    goals: goalsByTeam[entry.team.id] ?? 0,
    fouls: stat(entry.statistics, "Fouls"),
    yellow_cards: stat(entry.statistics, "Yellow Cards"),
    red_cards: stat(entry.statistics, "Red Cards"),
    shots: stat(entry.statistics, "Total Shots"),
    shots_on_target: stat(entry.statistics, "Shots on Goal"),
  }));
}

export function mapPlayers(payload: { response: any[] }, teamId: number): Player[] {
  return payload.response.map((item) => ({
    team_id: teamId,
    name: item.player.name,
    position: item.statistics?.[0]?.games?.position ?? null,
    shirt_number: item.player.number ?? null,
  }));
}
