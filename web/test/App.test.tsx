import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import App from "../src/App";

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.restoreAllMocks();
  fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.includes("/api/sync")) {
      return new Response(JSON.stringify({ ok: true, dataAsOf: "2026-07-03T12:05:00.000Z" }));
    }
    if (url.includes("/api/bracket")) {
      return new Response(
        JSON.stringify({
          dataAsOf: "2026-07-03T12:00:00.000Z",
          rounds: [
            { key: "round_of_32", label: "Round of 32", matches: [] },
            { key: "round_of_16", label: "Round of 16", matches: [] },
            { key: "quarter_final", label: "Quarter-finals", matches: [] },
            { key: "semi_final", label: "Semi-finals", matches: [] },
            { key: "third_place", label: "Third-place match", matches: [] },
            { key: "final", label: "Final", matches: [] },
          ],
        }),
      );
    }
    if (url.includes("/api/teams")) return new Response(JSON.stringify({ teams: [] }));
    if (url.includes("/api/standings/groups")) return new Response(JSON.stringify({ standings: [] }));
    if (url.includes("/api/standings")) return new Response(JSON.stringify({ standings: [] }));
    if (url.includes("/api/today")) return new Response(JSON.stringify({ fixtures: [], dataAsOf: null }));
    if (url.includes("/api/tomorrow")) return new Response(JSON.stringify({ fixtures: [], dataAsOf: null }));
    throw new Error(`Unhandled fetch: ${url}`);
  });
  vi.stubGlobal("fetch", fetchMock);
});

describe("App", () => {
  it("renders the bracket section above today's games", async () => {
    render(<App />);
    const bracketHeading = await screen.findByText("Knockout Bracket");
    const todaysHeading = await screen.findByText("Today's Games");
    expect(bracketHeading.compareDocumentPosition(todaysHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("primes a local sync before loading dashboard data on localhost", async () => {
    render(<App />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/sync", { method: "POST" });
    });
  });
});
