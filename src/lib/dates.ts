/** Calendar date (YYYY-MM-DD) for `date` in the given IANA timezone. */
export function localDateYmd(timeZone: string, date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(date);
}

export function addDaysYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

function getTimezoneOffsetMs(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(
    dtf.formatToParts(date).filter((p) => p.type !== "literal").map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return asUtc - date.getTime();
}

/** UTC ISO bounds [start, end) for a calendar day in the given timezone. */
export function localDayBoundsUtc(
  dateYmd: string,
  timeZone: string,
): { startUtc: string; endUtc: string } {
  const [y, m, d] = dateYmd.split("-").map(Number);
  let utc = Date.UTC(y, m - 1, d, 0, 0, 0);
  for (let i = 0; i < 3; i++) {
    utc = Date.UTC(y, m - 1, d, 0, 0, 0) - getTimezoneOffsetMs(new Date(utc), timeZone);
  }
  const start = new Date(utc);
  const nextYmd = addDaysYmd(dateYmd, 1);
  const [ny, nm, nd] = nextYmd.split("-").map(Number);
  let endUtc = Date.UTC(ny, nm - 1, nd, 0, 0, 0);
  for (let i = 0; i < 3; i++) {
    endUtc = Date.UTC(ny, nm - 1, nd, 0, 0, 0) - getTimezoneOffsetMs(new Date(endUtc), timeZone);
  }
  return { startUtc: start.toISOString(), endUtc: new Date(endUtc).toISOString() };
}

export function utcDatesAroundToday(): string[] {
  const today = new Date().toISOString().slice(0, 10);
  return [addDaysYmd(today, -1), today, addDaysYmd(today, 1)];
}
