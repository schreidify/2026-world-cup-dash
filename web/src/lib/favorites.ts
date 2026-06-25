const FAV_KEY = "wc:favorites";

export function getFavorites(): number[] {
  try {
    return JSON.parse(localStorage.getItem(FAV_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function isFavorite(teamId: number): boolean {
  return getFavorites().includes(teamId);
}

export function toggleFavorite(teamId: number): number[] {
  const current = getFavorites();
  const next = current.includes(teamId) ? current.filter((id) => id !== teamId) : [...current, teamId];
  localStorage.setItem(FAV_KEY, JSON.stringify(next));
  return next;
}

export interface GroupWithTeams {
  group: string;
  teamIds: number[];
}

export function orderGroupsFavoritesFirst<T extends GroupWithTeams>(groups: T[], favorites: number[]): T[] {
  const favSet = new Set(favorites);
  const hasFav = (g: T) => g.teamIds.some((id) => favSet.has(id));
  return [...groups].sort((a, b) => {
    const af = hasFav(a) ? 0 : 1;
    const bf = hasFav(b) ? 0 : 1;
    if (af !== bf) return af - bf;
    return a.group.localeCompare(b.group);
  });
}
