import { useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { ApiTeam } from "../lib/api";

interface Props {
  team: ApiTeam;
  isFavorite: boolean;
  onToggleFavorite?: (teamId: number) => void;
  children: ReactNode;
}

export function TeamHoverCard({ team, isFavorite, onToggleFavorite, children }: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLSpanElement>) => {
    cancelClose();
    const rect = e.currentTarget.getBoundingClientRect();
    setPos({ top: rect.bottom + 6, left: rect.left });
    setOpen(true);
  };

  const tooltip = open
    ? createPortal(
        <div
          style={{ top: pos.top, left: pos.left }}
          className="fixed z-[9999] w-52 rounded-xl border border-slate-200 bg-white p-3 shadow-xl"
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Historical Record</p>
          <div className="space-y-1.5 text-xs text-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Appearances</span>
              <span className="font-semibold tabular-nums">{team.appearances_since_1930}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Last Appearance</span>
              <span className="font-semibold tabular-nums">{team.last_appearance ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">All-Time Wins</span>
              <span className="font-semibold tabular-nums">{team.wins_since_1930}</span>
            </div>
          </div>
          {onToggleFavorite && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(team.id); }}
              className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border py-1.5 text-xs font-medium transition-colors ${
                isFavorite
                  ? "border-accent/30 bg-accent/10 text-accent hover:bg-accent/20"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {isFavorite ? "★ Favorited" : "☆ Add to Favorites"}
            </button>
          )}
        </div>,
        document.body,
      )
    : null;

  return (
    <span
      className="cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={scheduleClose}
    >
      {children}
      {tooltip}
    </span>
  );
}
