import type { ApiFixture, ApiTeam } from "../lib/api";
import { MatchCard } from "./MatchCard";

interface Props {
  fixtures: ApiFixture[];
  teams: Record<number, ApiTeam>;
  timezone: string;
  favorites: number[];
  onToggleFavorite: (teamId: number) => void;
}

export function TomorrowsGames({ fixtures, teams, timezone, favorites, onToggleFavorite }: Props) {
  if (fixtures.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-400">
        No games tomorrow.
      </div>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {fixtures.map((f) => (
        <MatchCard
          key={f.api_fixture_id}
          fixture={f}
          teams={teams}
          timezone={timezone}
          favorites={favorites}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}
