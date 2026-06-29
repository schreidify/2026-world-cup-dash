import type { ApiFixture, ApiTeam } from "../lib/api";
import { formatInZone } from "../lib/timezone";
import { TeamHoverCard } from "./TeamHoverCard";

interface Props {
  fixture: ApiFixture;
  teams: Record<number, ApiTeam>;
  timezone: string;
  favorites: number[];
  onToggleFavorite: (teamId: number) => void;
}

function Heart({
  teamId,
  country,
  favorites,
  onToggle,
}: {
  teamId: number | null;
  country: string;
  favorites: number[];
  onToggle: (id: number) => void;
}) {
  if (teamId == null) {
    return <span className="inline-block w-4" aria-hidden="true" />;
  }

  const active = favorites.includes(teamId);
  return (
    <button
      aria-label={`Favorite ${country}`}
      onClick={() => onToggle(teamId)}
      className={active ? "text-accent" : "text-slate-300 hover:text-slate-400"}
    >
      {active ? "♥" : "♡"}
    </button>
  );
}

export function MatchCard({ fixture, teams, timezone, favorites, onToggleFavorite }: Props) {
  const home = fixture.home_team_id != null ? teams[fixture.home_team_id] : undefined;
  const away = fixture.away_team_id != null ? teams[fixture.away_team_id] : undefined;
  const hasFavorite =
    (fixture.home_team_id != null && favorites.includes(fixture.home_team_id)) ||
    (fixture.away_team_id != null && favorites.includes(fixture.away_team_id));

  return (
    <div
      data-testid={hasFavorite ? "favorite-match-card" : undefined}
      className={`rounded-xl bg-white p-4 ${
        hasFavorite
          ? "outline outline-[3px] outline-green-600 outline-offset-2"
          : "border border-slate-200"
      }`}
    >
      <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500">
        <span>{fixture.stage}</span>
        {fixture.status === "live" && (
          <span className="rounded-full bg-accent/15 px-2 py-0.5 font-semibold text-accent">
            LIVE {fixture.elapsed_minute}'
          </span>
        )}
        {fixture.status === "finished" && <span className="font-semibold">Final</span>}
        {fixture.status === "scheduled" && <span>{formatInZone(fixture.datetime_utc, timezone)}</span>}
      </div>

      <div className="space-y-2">
        {[home, away].map((team, idx) => {
          const score = idx === 0 ? fixture.home_score : fixture.away_score;
          const isFavorite = favorites.includes(team?.id ?? -1);
          return (
            <div key={team?.id ?? idx} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart
                  teamId={team?.id ?? null}
                  country={team?.country ?? ""}
                  favorites={favorites}
                  onToggle={onToggleFavorite}
                />
                {team ? (
                  <TeamHoverCard team={team} isFavorite={isFavorite} onToggleFavorite={onToggleFavorite}>
                    <span className="flex items-center gap-2 font-medium text-navy">
                      {team.flag && <img src={team.flag} alt="" className="h-4 w-6 rounded-sm object-cover" />}
                      {team.country}
                    </span>
                  </TeamHoverCard>
                ) : (
                  <span className="font-medium text-navy">TBD</span>
                )}
              </div>
              {fixture.status !== "scheduled" && (
                <span className="text-lg font-bold tabular-nums">{score ?? 0}</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 text-xs text-slate-400">
        {fixture.venue}
        {fixture.city ? `, ${fixture.city}` : ""}
        {fixture.streaming_channel && (
          <span data-testid="streaming" className="ml-2 text-slate-500">
            on {fixture.streaming_channel}
          </span>
        )}
      </div>
    </div>
  );
}
