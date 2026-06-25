import { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { GroupStrip } from "./components/GroupStrip";
import { TodaysGames } from "./components/TodaysGames";
import { TomorrowsGames } from "./components/TomorrowsGames";
import { StandingsTable } from "./components/StandingsTable";
import { TeamDetailPanel } from "./components/TeamDetailPanel";
import {
  fetchToday,
  fetchTomorrow,
  fetchStandings,
  fetchGroupStandings,
  fetchTeams,
  fetchTeamDetail,
} from "./lib/api";
import type { ApiFixture, ApiStanding, ApiTeam } from "./lib/api";
import { getSavedTimezone, saveTimezone } from "./lib/timezone";
import { getFavorites, toggleFavorite } from "./lib/favorites";

const SHOW_MY_TEAMS = false;

export default function App() {
  const [timezone, setTimezone] = useState(getSavedTimezone());
  const [favorites, setFavorites] = useState<number[]>(getFavorites());
  const [fixtures, setFixtures] = useState<ApiFixture[]>([]);
  const [tomorrowFixtures, setTomorrowFixtures] = useState<ApiFixture[]>([]);
  const [standings, setStandings] = useState<ApiStanding[]>([]);
  const [groupStandings, setGroupStandings] = useState<ApiStanding[]>([]);
  const [teams, setTeams] = useState<ApiTeam[]>([]);
  const [dataAsOf, setDataAsOf] = useState<string | null>(null);

  useEffect(() => {
    fetchToday(timezone)
      .then((d) => {
        setFixtures(d.fixtures);
        setDataAsOf(d.dataAsOf);
      })
      .catch(() => {});
    fetchTomorrow(timezone)
      .then((d) => setTomorrowFixtures(d.fixtures))
      .catch(() => {});
    fetchStandings()
      .then((d) => setStandings(d.standings))
      .catch(() => {});
    fetchGroupStandings()
      .then((d) => setGroupStandings(d.standings))
      .catch(() => {});
    fetchTeams()
      .then((d) => setTeams(d.teams))
      .catch(() => {});
  }, [timezone]);

  const teamsById = Object.fromEntries(teams.map((t) => [t.id, t])) as Record<number, ApiTeam>;

  const handleTimezone = (tz: string) => {
    setTimezone(tz);
    saveTimezone(tz);
  };
  const handleFavorite = (teamId: number) => setFavorites(toggleFavorite(teamId));

  return (
    <div className="min-h-screen bg-slate-50">
      <Header timezone={timezone} onTimezoneChange={handleTimezone} dataAsOf={dataAsOf} />
      <main className="mx-auto max-w-3xl space-y-10 px-4 py-8">
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Groups</h2>
          <GroupStrip teams={teams} favorites={favorites} standings={groupStandings} onToggleFavorite={handleFavorite} />
        </section>
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Today's Games</h2>
          <TodaysGames
            fixtures={fixtures}
            teams={teamsById}
            timezone={timezone}
            favorites={favorites}
            onToggleFavorite={handleFavorite}
          />
        </section>
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Tomorrow's Games</h2>
          <TomorrowsGames
            fixtures={tomorrowFixtures}
            teams={teamsById}
            timezone={timezone}
            favorites={favorites}
            onToggleFavorite={handleFavorite}
          />
        </section>
        {SHOW_MY_TEAMS && (
          <section>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">My Teams</h2>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <TeamDetailPanel
                favorites={favorites}
                teams={teams}
                timezone={timezone}
                loadDetail={fetchTeamDetail}
              />
            </div>
          </section>
        )}
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Standings</h2>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <StandingsTable standings={standings} teams={teamsById} favorites={favorites} onToggleFavorite={handleFavorite} />
          </div>
        </section>
      </main>
    </div>
  );
}
