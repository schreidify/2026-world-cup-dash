import { describe, it, expect } from "vitest";
import { buildIcs, buildGoogleCalendarUrl } from "../src/lib/calendar";

const event = {
  title: "Brazil vs Croatia",
  startUtc: "2026-06-20T18:00:00.000Z",
  location: "MetLife Stadium, East Rutherford",
};

describe("buildIcs", () => {
  it("produces a valid VEVENT with UTC stamps and a 2 hour duration", () => {
    const ics = buildIcs(event);
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("SUMMARY:Brazil vs Croatia");
    expect(ics).toContain("DTSTART:20260620T180000Z");
    expect(ics).toContain("DTEND:20260620T200000Z");
    expect(ics).toContain("LOCATION:MetLife Stadium, East Rutherford");
    expect(ics).toContain("END:VEVENT");
  });
});

describe("buildGoogleCalendarUrl", () => {
  it("builds a render URL with encoded dates and title", () => {
    const url = buildGoogleCalendarUrl(event);
    expect(url).toContain("https://calendar.google.com/calendar/render?action=TEMPLATE");
    expect(url).toContain("text=Brazil+vs+Croatia");
    expect(url).toContain("dates=20260620T180000Z%2F20260620T200000Z");
  });
});
