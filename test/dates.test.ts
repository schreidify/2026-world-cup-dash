import { describe, it, expect } from "vitest";
import { addDaysYmd, localDateYmd, localDayBoundsUtc } from "../src/lib/dates";

describe("localDateYmd", () => {
  it("returns the calendar date in the given timezone", () => {
    const date = new Date("2026-06-16T06:00:00.000Z");
    expect(localDateYmd("America/New_York", date)).toBe("2026-06-16");
    expect(localDateYmd("UTC", date)).toBe("2026-06-16");
  });
});

describe("localDayBoundsUtc", () => {
  it("returns UTC bounds for a full calendar day in UTC", () => {
    const { startUtc, endUtc } = localDayBoundsUtc("2026-06-16", "UTC");
    expect(startUtc).toBe("2026-06-16T00:00:00.000Z");
    expect(endUtc).toBe("2026-06-17T00:00:00.000Z");
  });

  it("shifts bounds for US timezones", () => {
    const { startUtc, endUtc } = localDayBoundsUtc("2026-06-16", "America/New_York");
    expect(startUtc).toBe("2026-06-16T04:00:00.000Z");
    expect(endUtc).toBe("2026-06-17T04:00:00.000Z");
  });
});

describe("addDaysYmd", () => {
  it("advances the calendar date", () => {
    expect(addDaysYmd("2026-06-16", 1)).toBe("2026-06-17");
  });
});
