import { useEffect, useState } from "react";
import type { ApiTeam, ApiStanding, ApiFixture, ApiPlayer } from "../lib/api";
import { formatInZone } from "../lib/timezone";
import { buildGoogleCalendarUrl, downloadIcs } from "../lib/calendar";

interface Detail {
  standing: ApiStanding | null;
  nextGame: ApiFixture | null;
  roster: ApiPlayer[];
}

interface Props {
  favorites: number[];
  teams: ApiTeam[];
  timezone: string;
  loadDetail: (teamId: number) => Promise<Detail>;
}

export function TeamDetailPanel({ favorites, teams, timezone, loadDetail }: Props) {
  const favTeams = teams.filter((t) => favorites.includes(t.id));
  const [activeId, setActiveId] = useState<number | null>(favTeams[0]?.id ?? null);
  const [detail, setDetail] = useState<Detail | null>(null);

  useEffect(() => {
    if (favTeams.length && (activeId == null || !favorites.includes(activeId))) {
      setActiveId(favTeams[0].id);
    }
  }, [favorites, favTeams, activeId]);

  useEffect(() => {
    if (activeId != null) {
      setDetail(null);
      loadDetail(activeId).then(setDetail).catch(() => setDetail(null));
    }
  }, [activeId, loadDetail]);

  if (favTeams.length === 0) {
    return <p className="py-8 text-center text-slate-400">Pick a favorite team to see its detail.</p>;
  }

  const activeTeam = teams.find((t) => t.id === activeId);
  const teamsById = Object.fromEntries(teams.map((t) => [t.id, t])) as Record<number, ApiTeam>;
  const teamName = (teamId: number | null) => (teamId != null ? teamsById[teamId]?.country ?? "TBD" : "TBD");

  return (
    <div>
      <div role="tablist" className="mb-4 flex gap-2 overflow-x-auto">
        {favTeams.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={t.id === activeId}
            onClick={() => setActiveId(t.id)}
            className={`whitespace-nowrap rounded-full px-3 py-1 text-sm ${
              t.id === activeId ? "bg-navy text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            {t.country}
          </button>
        ))}
      </div>

      {!detail && <p className="text-slate-400">Loading...</p>}

      {detail && (
        <div className="space-y-4">
          {detail.standing && (
            <div className="text-sm text-slate-600">
              Record: {detail.standing.win}W {detail.standing.draw}D {detail.standing.loss}L,{" "}
              {detail.standing.points} pts, group {detail.standing.group}
            </div>
          )}

          {detail.nextGame && activeTeam && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-1 text-xs uppercase text-slate-400">Next game</div>
              <div className="font-medium text-navy">
                {teamName(detail.nextGame.home_team_id)} vs {teamName(detail.nextGame.away_team_id)}
              </div>
              <div className="text-sm text-slate-500">{formatInZone(detail.nextGame.datetime_utc, timezone)}</div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                <span className="font-medium text-slate-500">Add to Calendar:</span>
                <button
                  className="text-accent underline"
                  onClick={() =>
                    downloadIcs({
                      title: `${teamName(detail.nextGame!.home_team_id)} vs ${teamName(detail.nextGame!.away_team_id)}`,
                      startUtc: detail.nextGame!.datetime_utc,
                      location: `${detail.nextGame!.venue ?? ""}${detail.nextGame!.city ? ", " + detail.nextGame!.city : ""}`,
                    })
                  }
                >
                  .ics file
                </button>
                <a
                  className="text-accent underline"
                  href={buildGoogleCalendarUrl({
                    title: `${teamName(detail.nextGame.home_team_id)} vs ${teamName(detail.nextGame.away_team_id)}`,
                    startUtc: detail.nextGame.datetime_utc,
                    location: `${detail.nextGame.venue ?? ""}${detail.nextGame.city ? ", " + detail.nextGame.city : ""}`,
                  })}
                  target="_blank"
                  rel="noreferrer"
                >
                  Google Calendar
                </a>
              </div>
            </div>
          )}

          <div>
            <div className="mb-2 text-xs uppercase text-slate-400">Roster</div>
            {detail.roster.length === 0 ? (
              <p className="text-sm text-slate-400">Roster loading. Check back after the next sync.</p>
            ) : (
              <ul className="grid grid-cols-2 gap-1 text-sm">
                {detail.roster.map((p) => (
                  <li key={p.name} className="text-slate-700">
                    {p.shirt_number != null ? `${p.shirt_number}. ` : ""}
                    {p.name}
                    {p.position ? <span className="text-slate-400"> ({p.position})</span> : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
