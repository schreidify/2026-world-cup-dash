import { describe, it, expect, beforeEach } from "vitest";
import { getFavorites, toggleFavorite, isFavorite, orderGroupsFavoritesFirst } from "../src/lib/favorites";

beforeEach(() => localStorage.clear());

describe("favorites", () => {
  it("starts empty, toggles on and off", () => {
    expect(getFavorites()).toEqual([]);
    toggleFavorite(10);
    expect(isFavorite(10)).toBe(true);
    toggleFavorite(10);
    expect(isFavorite(10)).toBe(false);
  });
});

describe("orderGroupsFavoritesFirst", () => {
  it("puts groups containing favorite teams first, then alphabetical", () => {
    const groups = [
      { group: "A", teamIds: [1, 2] },
      { group: "B", teamIds: [3, 4] },
      { group: "C", teamIds: [30, 5] },
      { group: "D", teamIds: [6, 7] },
    ];
    const ordered = orderGroupsFavoritesFirst(groups, [30]);
    expect(ordered.map((g) => g.group)).toEqual(["C", "A", "B", "D"]);
  });

  it("is purely alphabetical when there are no favorites", () => {
    const groups = [
      { group: "B", teamIds: [3] },
      { group: "A", teamIds: [1] },
    ];
    expect(orderGroupsFavoritesFirst(groups, []).map((g) => g.group)).toEqual(["A", "B"]);
  });
});
