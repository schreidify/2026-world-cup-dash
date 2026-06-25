import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { GroupStrip } from "../src/components/GroupStrip";
import type { ApiStanding, ApiTeam } from "../src/lib/api";

const teams: ApiTeam[] = [
  {
    id: 1,
    country: "A1",
    group: "A",
    flag: "",
    fifa_code: "A1",
    appearances_since_1930: 0,
    last_appearance: null,
    wins_since_1930: 0,
  },
  {
    id: 2,
    country: "B1",
    group: "B",
    flag: "",
    fifa_code: "B1",
    appearances_since_1930: 0,
    last_appearance: null,
    wins_since_1930: 0,
  },
  {
    id: 3,
    country: "C1",
    group: "C",
    flag: "",
    fifa_code: "C1",
    appearances_since_1930: 0,
    last_appearance: null,
    wins_since_1930: 0,
  },
];

const standings: ApiStanding[] = [
  {
    group: "A",
    team_id: 1,
    played: 2,
    win: 2,
    loss: 0,
    draw: 0,
    gf: 5,
    ga: 1,
    gd: 4,
    points: 6,
    rank: 1,
  },
];

describe("GroupStrip", () => {
  it("orders the favorited team's group first", () => {
    render(<GroupStrip teams={teams} favorites={[3]} standings={standings} />);
    const headings = screen.getAllByTestId("group-label").map((el) => el.textContent);
    expect(headings[0]).toContain("C");
  });

  it("uses group-specific standings when a team has multiple rows", () => {
    const groupCTeams: ApiTeam[] = [
      {
        id: 6,
        country: "Brazil",
        group: "C",
        flag: "",
        fifa_code: "BRA",
        appearances_since_1930: 0,
        last_appearance: null,
        wins_since_1930: 0,
      },
      {
        id: 31,
        country: "Morocco",
        group: "C",
        flag: "",
        fifa_code: "MAR",
        appearances_since_1930: 0,
        last_appearance: null,
        wins_since_1930: 0,
      },
      {
        id: 1108,
        country: "Scotland",
        group: "C",
        flag: "",
        fifa_code: "SCO",
        appearances_since_1930: 0,
        last_appearance: null,
        wins_since_1930: 0,
      },
      {
        id: 2386,
        country: "Haiti",
        group: "C",
        flag: "",
        fifa_code: "HAI",
        appearances_since_1930: 0,
        last_appearance: null,
        wins_since_1930: 0,
      },
    ];
    const groupCStandings: ApiStanding[] = [
      { group: "C", team_id: 6, played: 3, win: 2, loss: 0, draw: 1, gf: 7, ga: 1, gd: 6, points: 7, rank: 1 },
      { group: "Group Stage", team_id: 6, played: 1, win: 0, loss: 0, draw: 1, gf: 1, ga: 1, gd: 0, points: 1, rank: 2 },
      { group: "C", team_id: 31, played: 3, win: 2, loss: 0, draw: 1, gf: 6, ga: 3, gd: 3, points: 7, rank: 2 },
      { group: "C", team_id: 1108, played: 3, win: 1, loss: 2, draw: 0, gf: 1, ga: 4, gd: -3, points: 3, rank: 3 },
      { group: "C", team_id: 2386, played: 3, win: 0, loss: 3, draw: 0, gf: 2, ga: 8, gd: -6, points: 0, rank: 4 },
    ];

    render(<GroupStrip teams={groupCTeams} favorites={[1108]} standings={groupCStandings} />);

    const groupC = screen.getByText("Group C").closest(".rounded-xl")!;
    const row = within(groupC).getByText("BRA").closest("li")!;
    expect(within(row).getByTestId("team-record-w")).toHaveTextContent("2");
    expect(within(row).getByTestId("team-record-d")).toHaveTextContent("1");
    expect(within(row).getByTestId("team-record-gd")).toHaveTextContent("+6");
  });

  it("orders teams by points then goal difference, not API rank", () => {
    const groupCTeams: ApiTeam[] = [
      {
        id: 10,
        country: "Brazil",
        group: "C",
        flag: "",
        fifa_code: "BRA",
        appearances_since_1930: 0,
        last_appearance: null,
        wins_since_1930: 0,
      },
      {
        id: 11,
        country: "Morocco",
        group: "C",
        flag: "",
        fifa_code: "MAR",
        appearances_since_1930: 0,
        last_appearance: null,
        wins_since_1930: 0,
      },
      {
        id: 12,
        country: "Scotland",
        group: "C",
        flag: "",
        fifa_code: "SCO",
        appearances_since_1930: 0,
        last_appearance: null,
        wins_since_1930: 0,
      },
      {
        id: 13,
        country: "Haiti",
        group: "C",
        flag: "",
        fifa_code: "HAI",
        appearances_since_1930: 0,
        last_appearance: null,
        wins_since_1930: 0,
      },
    ];
    const groupCStandings: ApiStanding[] = [
      { group: "C", team_id: 10, played: 3, win: 2, loss: 0, draw: 1, gf: 8, ga: 2, gd: 6, points: 7, rank: 1 },
      { group: "C", team_id: 11, played: 3, win: 2, loss: 0, draw: 1, gf: 5, ga: 2, gd: 3, points: 7, rank: 2 },
      { group: "C", team_id: 13, played: 3, win: 0, loss: 3, draw: 0, gf: 2, ga: 8, gd: -6, points: 0, rank: 3 },
      { group: "C", team_id: 12, played: 3, win: 1, loss: 2, draw: 0, gf: 3, ga: 6, gd: -3, points: 3, rank: 4 },
    ];

    render(<GroupStrip teams={groupCTeams} favorites={[12]} standings={groupCStandings} />);

    const groupC = screen.getByText("Group C").closest(".rounded-xl")!;
    const teamCodes = within(groupC)
      .getAllByText(/BRA|MAR|SCO|HAI/)
      .map((el) => el.textContent);
    expect(teamCodes).toEqual(["BRA", "MAR", "SCO", "HAI"]);
  });

  it("shows W L D GD headers and aligned stats for each group", () => {
    render(<GroupStrip teams={teams} favorites={[]} standings={standings} />);
    const groupA = screen.getByText("Group A").closest(".rounded-xl")!;
    expect(within(groupA).getByText("W")).toBeInTheDocument();
    expect(within(groupA).getByText("GD")).toBeInTheDocument();
    const row = within(groupA).getByText("A1").closest("li")!;
    expect(within(row).getByTestId("team-record-w")).toHaveTextContent("2");
    expect(within(row).getByTestId("team-record-l")).toHaveTextContent("0");
    expect(within(row).getByTestId("team-record-d")).toHaveTextContent("0");
    expect(within(row).getByTestId("team-record-gd")).toHaveTextContent("+4");
  });

  it("shows zeros when standings are unavailable", () => {
    render(<GroupStrip teams={teams} favorites={[]} standings={[]} />);
    expect(screen.getAllByTestId("team-record-w").every((el) => el.textContent === "0")).toBe(true);
    expect(screen.getAllByTestId("team-record-gd").every((el) => el.textContent === "0")).toBe(true);
  });
});
