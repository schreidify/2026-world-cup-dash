const TZ_KEY = "wc:timezone";

export function getSavedTimezone(): string {
  return localStorage.getItem(TZ_KEY) ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function saveTimezone(tz: string): void {
  localStorage.setItem(TZ_KEY, tz);
}

export function formatInZone(isoUtc: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(isoUtc));
}

export const COMMON_ZONES = [
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "Europe/London",
  "Europe/Paris",
  "UTC",
];
