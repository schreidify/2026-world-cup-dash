import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MatchCard } from "../src/components/MatchCard";
import type { ApiFixture, ApiTeam } from "../src/lib/api";

const teams: Record<number, ApiTeam> = {
  10: {
    id: 10,
    country: "Brazil",
    group: "A",
    flag: "",
    fifa_code: "BRA",
    appearances_since_1930: 22,
    last_appearance: 2022,
    wins_since_1930: 5,
  },
  20: {
    id: 20,
    country: "Croatia",
    group: "A",
    flag: "",
    fifa_code: "CRO",
    appearances_since_1930: 6,
    last_appearance: 2022,
    wins_since_1930: 0,
  },
};

function base(overrides: Partial<ApiFixture>): ApiFixture {
  return {
    api_fixture_id: 1,
    stage: "Group A",
    group: "A",
    datetime_utc: "2026-06-20T18:00:00.000Z",
    venue: "MetLife",
    city: "East Rutherford",
    home_team_id: 10,
    away_team_id: 20,
    status: "scheduled",
    elapsed_minute: null,
    home_score: null,
    away_score: null,
    streaming_channel: null,
    ...overrides,
  };
}

describe("MatchCard", () => {
  it("shows kickoff time for an upcoming match", () => {
    render(
      <MatchCard
        fixture={base({})}
        teams={teams}
        timezone="America/New_York"
        favorites={[]}
        onToggleFavorite={() => {}}
      />,
    );
    expect(screen.getByText("Brazil")).toBeInTheDocument();
    expect(screen.getByText(/2:00/)).toBeInTheDocument();
  });

  it("shows a LIVE badge with elapsed minute and score for a live match", () => {
    render(
      <MatchCard
        fixture={base({ status: "live", elapsed_minute: 67, home_score: 1, away_score: 0 })}
        teams={teams}
        timezone="UTC"
        favorites={[]}
        onToggleFavorite={() => {}}
      />,
    );
    expect(screen.getByText(/LIVE 67/)).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("shows the final score for a finished match", () => {
    render(
      <MatchCard
        fixture={base({ status: "finished", home_score: 2, away_score: 1 })}
        teams={teams}
        timezone="UTC"
        favorites={[]}
        onToggleFavorite={() => {}}
      />,
    );
    expect(screen.getByText(/Final/i)).toBeInTheDocument();
  });

  it("hides streaming channel when not available", () => {
    render(
      <MatchCard fixture={base({})} teams={teams} timezone="UTC" favorites={[]} onToggleFavorite={() => {}} />,
    );
    expect(screen.queryByTestId("streaming")).toBeNull();
  });

  it("outlines the whole card when a favorited team is playing", () => {
    render(
      <MatchCard fixture={base({})} teams={teams} timezone="UTC" favorites={[10]} onToggleFavorite={() => {}} />,
    );
    expect(screen.getByTestId("favorite-match-card")).toHaveClass("outline-green-600");
  });

  it("does not outline the card when no teams are favorited", () => {
    render(
      <MatchCard fixture={base({})} teams={teams} timezone="UTC" favorites={[]} onToggleFavorite={() => {}} />,
    );
    expect(screen.queryByTestId("favorite-match-card")).toBeNull();
  });

  it("fires onToggleFavorite when a heart is clicked", () => {
    const spy = vi.fn();
    render(
      <MatchCard fixture={base({})} teams={teams} timezone="UTC" favorites={[]} onToggleFavorite={spy} />,
    );
    fireEvent.click(screen.getByLabelText("Favorite Brazil"));
    expect(spy).toHaveBeenCalledWith(10);
  });

  it("renders TBD safely when a team id is missing", () => {
    render(
      <MatchCard
        fixture={base({ home_team_id: null, home_score: null })}
        teams={teams}
        timezone="UTC"
        favorites={[]}
        onToggleFavorite={() => {}}
      />,
    );
    expect(screen.getByText("TBD")).toBeInTheDocument();
  });
});
