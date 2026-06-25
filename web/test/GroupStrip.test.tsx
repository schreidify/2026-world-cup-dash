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
