import { COMMON_ZONES } from "../lib/timezone";

interface Props {
  timezone: string;
  onTimezoneChange: (tz: string) => void;
  dataAsOf: string | null;
}

export function Header({ timezone, onTimezoneChange, dataAsOf }: Props) {
  return (
    <header className="sticky top-0 z-10 bg-navy text-white shadow-sm">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
        <h1 className="font-display text-xl font-bold tracking-tight">World Cup 2026 Live</h1>
        <div className="flex items-center gap-3">
          {dataAsOf && (
            <span className="hidden text-xs text-slate-300 sm:inline">
              data as of{" "}
              {new Date(dataAsOf).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </span>
          )}
          <select
            aria-label="Timezone"
            value={timezone}
            onChange={(e) => onTimezoneChange(e.target.value)}
            className="rounded border border-white/10 bg-navy-deep px-2 py-1 text-sm"
          >
            {COMMON_ZONES.map((z) => (
              <option key={z} value={z}>
                {z.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}
