import { describe, it, expect } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { TeamDetailPanel } from "../src/components/TeamDetailPanel";
import type { ApiTeam } from "../src/lib/api";

const teams: ApiTeam[] = [
  {
    id: 10,
    country: "Brazil",
    group: "A",
    flag: "",
    fifa_code: "BRA",
    appearances_since_1930: 22,
    last_appearance: 2022,
    wins_since_1930: 5,
  },
  {
    id: 20,
    country: "France",
    group: "B",
    flag: "",
    fifa_code: "FRA",
    appearances_since_1930: 16,
    last_appearance: 2022,
    wins_since_1930: 2,
  },
];

const loadDetail = async (teamId: number) => ({
  standing: {
    group: "A",
    team_id: teamId,
    played: 2,
    win: 2,
    loss: 0,
    draw: 0,
    gf: 4,
    ga: 0,
    gd: 4,
    points: 6,
    rank: 1,
  },
  nextGame: {
    api_fixture_id: 99,
    stage: "Group A",
    group: "A",
    datetime_utc: "2026-06-25T18:00:00.000Z",
    venue: "Rose Bowl",
    city: "Pasadena",
    home_team_id: teamId,
    away_team_id: 20,
    status: "scheduled" as const,
    elapsed_minute: null,
    home_score: null,
    away_score: null,
    streaming_channel: null,
  },
  roster: [{ team_id: teamId, name: "Star Player", position: "Attacker", shirt_number: 10 }],
});

describe("TeamDetailPanel", () => {
  it("shows a tab per favorite and loads the first team's detail", async () => {
    render(<TeamDetailPanel favorites={[10, 20]} teams={teams} timezone="UTC" loadDetail={loadDetail} />);
    expect(screen.getByRole("tab", { name: "Brazil" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "France" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/Star Player/)).toBeInTheDocument());
    expect(screen.getByText(/6 pts/i)).toBeInTheDocument();
  });

  it("renders an Add to Calendar control for the next game", async () => {
    render(<TeamDetailPanel favorites={[10]} teams={teams} timezone="UTC" loadDetail={loadDetail} />);
    await waitFor(() => expect(screen.getByText(/add to calendar/i)).toBeInTheDocument());
    expect(screen.getByRole("link", { name: /google calendar/i })).toHaveAttribute(
      "href",
      expect.stringContaining("calendar.google.com"),
    );
  });

  it("shows an empty state when there are no favorites", () => {
    render(<TeamDetailPanel favorites={[]} teams={teams} timezone="UTC" loadDetail={loadDetail} />);
    expect(screen.getByText(/pick a favorite team/i)).toBeInTheDocument();
  });
});
