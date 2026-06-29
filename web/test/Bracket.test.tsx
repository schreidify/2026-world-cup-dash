import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { Bracket } from "../src/components/Bracket";
import type { ApiBracketRound, ApiTeam } from "../src/lib/api";

const teams: Record<number, ApiTeam> = {
  10: {
    id: 10,
    country: "Brazil",
    group: "A",
    flag: "https://example.com/brazil.png",
    fifa_code: "BRA",
    appearances_since_1930: 22,
    last_appearance: 2022,
    wins_since_1930: 5,
  },
  20: {
    id: 20,
    country: "Croatia",
    group: "B",
    flag: "https://example.com/croatia.png",
    fifa_code: "CRO",
    appearances_since_1930: 6,
    last_appearance: 2022,
    wins_since_1930: 0,
  },
  30: {
    id: 30,
    country: "Japan",
    group: "C",
    flag: "https://example.com/japan.png",
    fifa_code: "JPN",
    appearances_since_1930: 7,
    last_appearance: 2022,
    wins_since_1930: 0,
  },
  40: {
    id: 40,
    country: "Canada",
    group: "D",
    flag: "https://example.com/canada.png",
    fifa_code: "CAN",
    appearances_since_1930: 3,
    last_appearance: 2022,
    wins_since_1930: 0,
  },
};

function makeRounds(overrides: Partial<Record<string, Partial<ApiBracketRound["matches"][number]>>> = {}): ApiBracketRound[] {
  const baseMatch = (slotId: string, stage: ApiBracketRound["key"], order: number) => ({
    slotId,
    stage,
    order,
    fixtureId: null,
    datetimeUtc: null,
    status: "tbd" as const,
    homeTeamId: null,
    awayTeamId: null,
    homePossibleTeamIds: [],
    awayPossibleTeamIds: [],
    homeLabel: "TBD",
    awayLabel: "TBD",
    homeScore: null,
    awayScore: null,
    winnerAdvancesTo: null,
    loserAdvancesTo: null,
    venue: null,
    city: null,
    ...(overrides[slotId] ?? {}),
  });

  return [
    {
      key: "round_of_32",
      label: "Round of 32",
      matches: [
        baseMatch("R32-1", "round_of_32", 1),
        baseMatch("R32-2", "round_of_32", 2),
      ],
    },
    {
      key: "round_of_16",
      label: "Round of 16",
      matches: [
        baseMatch("R16-1", "round_of_16", 1),
        baseMatch("R16-2", "round_of_16", 2),
      ],
    },
    {
      key: "quarter_final",
      label: "Quarter-finals",
      matches: [baseMatch("QF-1", "quarter_final", 1)],
    },
    {
      key: "semi_final",
      label: "Semi-finals",
      matches: [baseMatch("SF-1", "semi_final", 1)],
    },
    {
      key: "third_place",
      label: "Third-place match",
      matches: [baseMatch("TP-1", "third_place", 1)],
    },
    {
      key: "final",
      label: "Final",
      matches: [baseMatch("F-1", "final", 1)],
    },
  ];
}

describe("Bracket", () => {
  it("renders rounds in order and shows TBD labels safely", () => {
    render(
      <Bracket
        rounds={makeRounds({ "QF-1": { homeLabel: "Winner R16 1", awayLabel: "Winner R16 2" } })}
        teams={teams}
        timezone="UTC"
        favorites={[]}
        onToggleFavorite={() => {}}
      />,
    );
    expect(screen.getAllByText("Round of 32")).toHaveLength(2);
    expect(screen.getAllByText("Semi-finals")).toHaveLength(2);
    expect(screen.getAllByText("Quarter-finals")).toHaveLength(2);
    expect(screen.getByText("Winner R16 1")).toBeInTheDocument();
    expect(screen.getByText("Winner R16 2")).toBeInTheDocument();
    expect(screen.getByTestId("bracket-column-left-round_of_32")).toBeInTheDocument();
    expect(screen.getByTestId("bracket-column-right-round_of_32")).toBeInTheDocument();
    expect(screen.getByTestId("bracket-column-center")).toBeInTheDocument();
  });

  it("centers each next-round match between its feeder matches", () => {
    render(<Bracket rounds={makeRounds()} teams={teams} timezone="UTC" favorites={[]} onToggleFavorite={() => {}} />);

    expect(screen.getByTestId("bracket-slot-wrap-R32-1")).toHaveStyle({ top: "0rem" });
    expect(screen.getByTestId("bracket-slot-wrap-R32-2")).toHaveStyle({ top: "11rem" });
    expect(screen.getByTestId("bracket-slot-wrap-R16-1")).toHaveStyle({ top: "5.5rem" });
  });

  it("draws connector lines between feeder matches and future rounds", () => {
    render(<Bracket rounds={makeRounds()} teams={teams} timezone="UTC" favorites={[]} onToggleFavorite={() => {}} />);

    expect(screen.getByTestId("bracket-connector-outgoing-horizontal-R32-1")).toBeInTheDocument();
    expect(screen.getByTestId("bracket-connector-outgoing-vertical-R32-1")).toBeInTheDocument();
    expect(screen.getByTestId("bracket-connector-incoming-R16-1")).toBeInTheDocument();
    expect(screen.getByTestId("bracket-connector-incoming-final-left")).toBeInTheDocument();
    expect(screen.getByTestId("bracket-connector-incoming-final-right")).toBeInTheDocument();
  });

  it("renders scheduled, live, finished, and TBD states", () => {
    render(
      <Bracket
        rounds={makeRounds({
          "R16-1": {
            status: "scheduled",
            datetimeUtc: "2026-07-04T18:00:00.000Z",
            homeTeamId: 10,
            awayTeamId: 20,
            homeLabel: "Brazil",
            awayLabel: "Croatia",
          },
          "R16-2": {
            status: "live",
            homeScore: 1,
            awayScore: 0,
            homeLabel: "TBD",
            awayLabel: "TBD",
          },
          "SF-1": {
            status: "finished",
            homeScore: 2,
            awayScore: 1,
          },
        })}
        teams={teams}
        timezone="UTC"
        favorites={[]}
        onToggleFavorite={() => {}}
      />,
    );

    expect(screen.getAllByText(/Sat 6:00 PM/).length).toBeGreaterThan(0);
    expect(screen.getByText("Live")).toBeInTheDocument();
    expect(within(screen.getByTestId("bracket-slot-SF-1")).getByText("Final")).toBeInTheDocument();
    expect(screen.getAllByText("TBD").length).toBeGreaterThan(0);
  });

  it("highlights a favorite team's current and downstream path", () => {
    render(
      <Bracket
        rounds={makeRounds({
          "R16-1": {
            status: "scheduled",
            homeTeamId: 10,
            awayTeamId: 20,
            homeLabel: "Brazil",
            awayLabel: "Croatia",
            winnerAdvancesTo: "QF-1",
          },
          "QF-1": {
            homeLabel: "Winner R16 1",
            awayLabel: "Winner R16 2",
            winnerAdvancesTo: "SF-1",
          },
          "SF-1": {
            homeLabel: "Winner QF 1",
            awayLabel: "Winner QF 2",
            winnerAdvancesTo: "F-1",
            loserAdvancesTo: "TP-1",
          },
        })}
        teams={teams}
        timezone="UTC"
        favorites={[10]}
        onToggleFavorite={() => {}}
      />,
    );

    expect(screen.getByTestId("bracket-slot-R16-1")).toHaveClass("border-accent");
    expect(screen.getByTestId("bracket-slot-QF-1")).toHaveClass("border-accent");
    expect(screen.getByTestId("bracket-slot-R16-2")).toHaveClass("opacity-45");
  });

  it("routes a favorite to third-place instead of the final after a semi-final loss", () => {
    render(
      <Bracket
        rounds={makeRounds({
          "SF-1": {
            status: "finished",
            homeTeamId: 10,
            awayTeamId: 20,
            homeLabel: "Brazil",
            awayLabel: "Croatia",
            homeScore: 0,
            awayScore: 1,
            winnerAdvancesTo: "F-1",
            loserAdvancesTo: "TP-1",
          },
        })}
        teams={teams}
        timezone="UTC"
        favorites={[10]}
        onToggleFavorite={() => {}}
      />,
    );

    expect(screen.getByTestId("bracket-slot-TP-1")).toHaveClass("border-accent");
    expect(screen.getByTestId("bracket-slot-F-1")).not.toHaveClass("border-accent");
  });

  it("uses the flag as the hover trigger for team details", () => {
    render(
      <Bracket
        rounds={makeRounds({
          "R16-1": {
            homeTeamId: 10,
            awayTeamId: 20,
            homeLabel: "Brazil",
            awayLabel: "Croatia",
          },
        })}
        teams={teams}
        timezone="UTC"
        favorites={[]}
        onToggleFavorite={() => {}}
      />,
    );

    expect(screen.getByTestId("bracket-team-flag-10")).toBeInTheDocument();
    expect(screen.getByTestId("bracket-team-flag-20")).toBeInTheDocument();
  });

  it("shows possible R16 opponents as multiple flags with a slash separator", () => {
    render(
      <Bracket
        rounds={makeRounds({
          "R16-1": {
            homeTeamId: 40,
            homeLabel: "Canada",
            awayTeamId: null,
            awayPossibleTeamIds: [10, 30],
            awayLabel: "Brazil / Japan",
          },
        })}
        teams={teams}
        timezone="UTC"
        favorites={[]}
        onToggleFavorite={() => {}}
      />,
    );

    expect(screen.getByText("Brazil / Japan")).toBeInTheDocument();
    expect(screen.getByTestId("bracket-team-flag-10")).toBeInTheDocument();
    expect(screen.getByTestId("bracket-team-flag-30")).toBeInTheDocument();
  });
});
