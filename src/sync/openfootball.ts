export interface CountryHistory {
  appearances_since_1930: number;
  last_appearance: number | null;
  wins_since_1930: number;
}

interface Tournament {
  year: number;
  data: { rounds?: { name: string; matches: any[] }[]; matches?: any[] };
}

function teamName(team: string | { name?: string } | undefined): string | null {
  if (!team) return null;
  if (typeof team === "string") return team;
  return team.name ?? null;
}

function normalizeMatches(data: Tournament["data"]): { roundName: string; matches: any[] }[] {
  if (data.rounds) {
    return data.rounds.map((round) => ({ roundName: round.name, matches: round.matches ?? [] }));
  }
  if (data.matches) {
    const byRound = new Map<string, any[]>();
    for (const match of data.matches) {
      const roundName = match.round ?? "Unknown";
      if (!byRound.has(roundName)) byRound.set(roundName, []);
      byRound.get(roundName)!.push(match);
    }
    return [...byRound.entries()].map(([roundName, matches]) => ({ roundName, matches }));
  }
  return [];
}

export function aggregateHistory(tournaments: Tournament[]): Record<string, CountryHistory> {
  const map: Record<string, CountryHistory> = {};
  const ensure = (name: string) => {
    if (!map[name]) map[name] = { appearances_since_1930: 0, last_appearance: null, wins_since_1930: 0 };
    return map[name];
  };

  for (const { year, data } of tournaments) {
    const seen = new Set<string>();
    for (const { roundName, matches } of normalizeMatches(data)) {
      for (const m of matches) {
        const t1 = teamName(m.team1);
        const t2 = teamName(m.team2);
        if (t1) seen.add(t1);
        if (t2) seen.add(t2);

        if (/^final$/i.test(roundName.trim()) && !/semi|quarter|3rd|third/i.test(roundName) && m.score?.ft) {
          const [a, b] = m.score.ft;
          const winner = a > b ? t1 : b > a ? t2 : null;
          if (winner) ensure(winner).wins_since_1930++;
        }
      }
    }
    for (const name of seen) {
      const c = ensure(name);
      c.appearances_since_1930++;
      c.last_appearance = year;
    }
  }
  return map;
}
