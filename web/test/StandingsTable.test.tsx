import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StandingsTable } from "../src/components/StandingsTable";
import type { ApiStanding, ApiTeam } from "../src/lib/api";

const standings: ApiStanding[] = [
  {
    group: "A",
    team_id: 10,
    played: 3,
    win: 3,
    loss: 0,
    draw: 0,
    gf: 7,
    ga: 1,
    gd: 6,
    points: 9,
    rank: 1,
  },
  {
    group: "B",
    team_id: 20,
    played: 3,
    win: 2,
    loss: 1,
    draw: 0,
    gf: 5,
    ga: 3,
    gd: 2,
    points: 6,
    rank: 1,
  },
];
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
    country: "France",
    group: "B",
    flag: "",
    fifa_code: "FRA",
    appearances_since_1930: 16,
    last_appearance: 2022,
    wins_since_1930: 2,
  },
};

describe("StandingsTable", () => {
  it("renders a row per standing with W/L/D, GD, group, points", () => {
    render(<StandingsTable standings={standings} teams={teams} />);
    expect(screen.getByText("Brazil")).toBeInTheDocument();
    expect(screen.getByText("France")).toBeInTheDocument();
    const brazilRow = screen.getByText("Brazil").closest("tr")!;
    expect(brazilRow).toHaveTextContent("9");
    expect(brazilRow).toHaveTextContent("6");
  });

  it("shows an empty state when there are no standings", () => {
    render(<StandingsTable standings={[]} teams={teams} />);
    expect(screen.getByText(/no standings yet/i)).toBeInTheDocument();
  });
});
