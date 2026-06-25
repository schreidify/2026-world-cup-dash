import { describe, it, expect } from "vitest";
import { formatInZone } from "../src/lib/timezone";

describe("formatInZone", () => {
  it("renders a UTC ISO time in New York zone", () => {
    const out = formatInZone("2026-06-20T18:00:00.000Z", "America/New_York");
    expect(out).toMatch(/2:00/);
    expect(out).toMatch(/PM/i);
  });

  it("renders the same instant in Los Angeles zone", () => {
    const out = formatInZone("2026-06-20T18:00:00.000Z", "America/Los_Angeles");
    expect(out).toMatch(/11:00/);
    expect(out).toMatch(/AM/i);
  });
});
