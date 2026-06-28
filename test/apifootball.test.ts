import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchStandings } from "../src/sync/apifootball";

describe("api-football retries", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("retries on rateLimit errors then succeeds", async () => {
    let calls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        calls++;
        if (calls === 1) {
          return new Response(JSON.stringify({ errors: { rateLimit: "Too many requests" }, results: 0 }), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ errors: [], response: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }),
    );

    const promise = fetchStandings("test-key");
    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(250);
    await promise;

    expect(calls).toBe(2);
  });
});
