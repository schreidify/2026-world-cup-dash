export interface CalendarEvent {
  title: string;
  startUtc: string;
  location: string;
}

function toIcsStamp(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function plusHours(iso: string, hours: number): string {
  return new Date(new Date(iso).getTime() + hours * 3600000).toISOString();
}

export function buildIcs(event: CalendarEvent): string {
  const start = toIcsStamp(event.startUtc);
  const end = toIcsStamp(plusHours(event.startUtc, 2));
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//World Cup Dashboard//EN",
    "BEGIN:VEVENT",
    `UID:${start}-${event.title.replace(/\s+/g, "")}@worldcup`,
    `DTSTAMP:${start}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${event.title}`,
    `LOCATION:${event.location}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function buildGoogleCalendarUrl(event: CalendarEvent): string {
  const start = toIcsStamp(event.startUtc);
  const end = toIcsStamp(plusHours(event.startUtc, 2));
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${start}/${end}`,
    location: event.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function downloadIcs(event: CalendarEvent): void {
  const blob = new Blob([buildIcs(event)], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.title.replace(/\s+/g, "_")}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}
