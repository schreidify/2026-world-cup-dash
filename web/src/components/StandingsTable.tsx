import type { ApiStanding, ApiTeam } from "../lib/api";
import { TeamHoverCard } from "./TeamHoverCard";

interface Props {
  standings: ApiStanding[];
  teams: Record<number, ApiTeam>;
  favorites?: number[];
  onToggleFavorite?: (teamId: number) => void;
}

export function StandingsTable({ standings, teams, favorites = [], onToggleFavorite }: Props) {
  if (standings.length === 0) {
    return <p className="py-8 text-center text-slate-400">No standings yet.</p>;
  }
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
          <th className="py-2">Team</th>
          <th className="py-2">Grp</th>
          <th className="py-2 text-center">W</th>
          <th className="py-2 text-center">D</th>
          <th className="py-2 text-center">L</th>
          <th className="py-2 text-center">GD</th>
          <th className="py-2 text-center">Pts</th>
        </tr>
      </thead>
      <tbody>
        {standings.map((s) => {
          const team = teams[s.team_id];
          const isFavorite = favorites.includes(s.team_id);
          return (
            <tr key={`${s.group}-${s.team_id}`} className="border-b border-slate-100">
              <td className="py-2">
                {team ? (
                  <TeamHoverCard team={team} isFavorite={isFavorite} onToggleFavorite={onToggleFavorite}>
                    <span className="flex items-center gap-2 font-medium text-navy">
                      {team.flag && <img src={team.flag} alt="" className="h-4 w-6 rounded-sm object-cover" />}
                      {team.country}
                    </span>
                  </TeamHoverCard>
                ) : (
                  <span className="font-medium text-navy">{s.team_id}</span>
                )}
              </td>
              <td className="py-2 text-slate-500">{s.group}</td>
              <td className="py-2 text-center">{s.win}</td>
              <td className="py-2 text-center">{s.draw}</td>
              <td className="py-2 text-center">{s.loss}</td>
              <td className={`py-2 text-center ${s.gd > 0 ? "font-semibold text-accent" : ""}`}>
                {s.gd > 0 ? `+${s.gd}` : s.gd}
              </td>
              <td className="py-2 text-center font-bold">{s.points}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
