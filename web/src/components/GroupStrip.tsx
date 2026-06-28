import { useEffect, useRef, useState } from "react";
import type { ApiStanding, ApiTeam } from "../lib/api";
import { orderGroupsFavoritesFirst } from "../lib/favorites";
import { compareGroupStandings, standingsByGroupAndTeam } from "../lib/standings";
import { TeamHoverCard } from "./TeamHoverCard";

interface Props {
  teams: ApiTeam[];
  favorites: number[];
  standings: ApiStanding[];
  onToggleFavorite?: (teamId: number) => void;
}

const STAT_GRID = "grid grid-cols-[minmax(0,1fr)_1.25rem_1.25rem_1.25rem_1.75rem] items-center gap-x-2";

function formatGd(gd: number): string {
  return gd > 0 ? `+${gd}` : String(gd);
}

function recordCells(standing: ApiStanding | undefined) {
  if (!standing) {
    return { win: 0, loss: 0, draw: 0, gd: "0" };
  }
  return {
    win: standing.win,
    loss: standing.loss,
    draw: standing.draw,
    gd: formatGd(standing.gd),
  };
}

function StatHeaders() {
  return (
    <div className={`${STAT_GRID} mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400`}>
      <div />
      <div className="text-center">W</div>
      <div className="text-center">L</div>
      <div className="text-center">D</div>
      <div className="text-right">GD</div>
    </div>
  );
}

interface TeamRowProps {
  t: ApiTeam;
  standing: ApiStanding | undefined;
  isFavorite: boolean;
  onToggleFavorite?: (teamId: number) => void;
}

function TeamRow({ t, standing, isFavorite, onToggleFavorite }: TeamRowProps) {
  const { win, loss, draw, gd } = recordCells(standing);
  const statClass = `tabular-nums text-xs ${isFavorite ? "font-semibold text-accent" : "text-slate-500"}`;

  return (
    <li className={STAT_GRID}>
      <TeamHoverCard team={t} isFavorite={isFavorite} onToggleFavorite={onToggleFavorite}>
        <span className={`flex min-w-0 items-center gap-2 ${isFavorite ? "font-semibold text-accent" : "text-navy"}`}>
          {t.flag && <img src={t.flag} alt="" className="h-3 w-5 shrink-0 rounded-sm object-cover" />}
          <span className="truncate">{t.fifa_code ?? t.country}</span>
        </span>
      </TeamHoverCard>
      <span data-testid="team-record-w" className={`${statClass} text-center`}>{win}</span>
      <span data-testid="team-record-l" className={`${statClass} text-center`}>{loss}</span>
      <span data-testid="team-record-d" className={`${statClass} text-center`}>{draw}</span>
      <span data-testid="team-record-gd" className={`${statClass} text-right`}>{gd}</span>
    </li>
  );
}

function GroupsScrollHint() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-slate-400"
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

export function GroupStrip({ teams, favorites, standings, onToggleFavorite }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollHint, setShowScrollHint] = useState(false);
  const standingsForGroup = standingsByGroupAndTeam(standings);

  const byGroup = new Map<string, ApiTeam[]>();
  for (const t of teams) {
    if (!t.group) continue;
    if (!byGroup.has(t.group)) byGroup.set(t.group, []);
    byGroup.get(t.group)!.push(t);
  }
  const groups = [...byGroup.entries()].map(([group, list]) => ({
    group,
    teamIds: list.map((t) => t.id),
    teams: [...list].sort((a, b) => {
      const sa = standingsForGroup.get(`${group}:${a.id}`);
      const sb = standingsForGroup.get(`${group}:${b.id}`);
      if (sa && sb) return compareGroupStandings(sa, sb);
      if (sa) return -1;
      if (sb) return 1;
      return a.country.localeCompare(b.country);
    }),
  }));
  const ordered = orderGroupsFavoritesFirst(groups, favorites);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const updateScrollHint = () => {
      const canScroll = el.scrollWidth > el.clientWidth + 1;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
      setShowScrollHint(canScroll && !atEnd);
    };

    updateScrollHint();
    el.addEventListener("scroll", updateScrollHint, { passive: true });
    window.addEventListener("resize", updateScrollHint);
    return () => {
      el.removeEventListener("scroll", updateScrollHint);
      window.removeEventListener("resize", updateScrollHint);
    };
  }, [ordered.length]);

  if (ordered.length === 0) {
    return <p className="text-sm text-slate-400">Groups will appear once team data is loaded.</p>;
  }

  return (
    <div className="relative">
      <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-2">
        {ordered.map((g) => (
          <div key={g.group} className="min-w-[200px] rounded-xl border border-slate-200 bg-white p-3">
            <div data-testid="group-label" className="mb-2 text-xs font-bold uppercase text-slate-400">
              Group {g.group}
            </div>
            <StatHeaders />
            <ul className="space-y-1.5 text-sm">
              {g.teams.map((t) => (
                <TeamRow
                  key={t.id}
                  t={t}
                  standing={standingsForGroup.get(`${g.group}:${t.id}`)}
                  isFavorite={favorites.includes(t.id)}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>
      {showScrollHint && (
        <div
          aria-hidden="true"
          data-testid="groups-scroll-hint"
          className="pointer-events-none absolute inset-y-0 right-0 flex w-12 items-center justify-end bg-gradient-to-l from-slate-50 via-slate-50/90 to-transparent pr-0.5"
        >
          <GroupsScrollHint />
        </div>
      )}
    </div>
  );
}
