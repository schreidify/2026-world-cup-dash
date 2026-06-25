import type { Fixture, Standing, Team, MatchStat, Player } from "../types";

export async function upsertFixtures(db: D1Database, fixtures: Fixture[]): Promise<void> {
  if (fixtures.length === 0) return;
  const stmt = db.prepare(
    `INSERT INTO fixtures (api_fixture_id, stage, "group", datetime_utc, venue, city,
       home_team_id, away_team_id, status, elapsed_minute, home_score, away_score, streaming_channel)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
     ON CONFLICT(api_fixture_id) DO UPDATE SET
       stage=excluded.stage, "group"=excluded."group", datetime_utc=excluded.datetime_utc,
       venue=excluded.venue, city=excluded.city, home_team_id=excluded.home_team_id,
       away_team_id=excluded.away_team_id, status=excluded.status,
       elapsed_minute=excluded.elapsed_minute, home_score=excluded.home_score,
       away_score=excluded.away_score, streaming_channel=excluded.streaming_channel`,
  );
  await db.batch(
    fixtures.map((f) =>
      stmt.bind(
        f.api_fixture_id,
        f.stage,
        f.group,
        f.datetime_utc,
        f.venue,
        f.city,
        f.home_team_id,
        f.away_team_id,
        f.status,
        f.elapsed_minute,
        f.home_score,
        f.away_score,
        f.streaming_channel,
      ),
    ),
  );
}

export async function getTodaysFixtures(db: D1Database, dateYmd: string): Promise<Fixture[]> {
  const { results } = await db
    .prepare(`SELECT * FROM fixtures WHERE substr(datetime_utc, 1, 10) = ? ORDER BY datetime_utc ASC`)
    .bind(dateYmd)
    .all<Fixture>();
  return results;
}

export async function getFixturesInRange(db: D1Database, startUtc: string, endUtc: string): Promise<Fixture[]> {
  const { results } = await db
    .prepare(`SELECT * FROM fixtures WHERE datetime_utc >= ? AND datetime_utc < ? ORDER BY datetime_utc ASC`)
    .bind(startUtc, endUtc)
    .all<Fixture>();
  return results;
}

export async function upsertStandings(db: D1Database, rows: Standing[]): Promise<void> {
  if (rows.length === 0) return;
  const stmt = db.prepare(
    `INSERT INTO standings ("group", team_id, played, win, loss, draw, gf, ga, gd, points, rank)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)
     ON CONFLICT("group", team_id) DO UPDATE SET
       played=excluded.played, win=excluded.win, loss=excluded.loss, draw=excluded.draw,
       gf=excluded.gf, ga=excluded.ga, gd=excluded.gd, points=excluded.points, rank=excluded.rank`,
  );
  await db.batch(
    rows.map((s) =>
      stmt.bind(s.group, s.team_id, s.played, s.win, s.loss, s.draw, s.gf, s.ga, s.gd, s.points, s.rank),
    ),
  );
}

export async function getTopStandings(db: D1Database, limit: number): Promise<Standing[]> {
  const { results } = await db
    .prepare(`SELECT * FROM standings ORDER BY points DESC, gd DESC LIMIT ?`)
    .bind(limit)
    .all<Standing>();
  return results;
}

export async function getStandingsByGroup(db: D1Database): Promise<Standing[]> {
  const { results } = await db
    .prepare(`SELECT * FROM standings WHERE length("group") = 1 ORDER BY "group" ASC, points DESC, gd DESC`)
    .all<Standing>();
  return results;
}

export async function getTeams(db: D1Database): Promise<Team[]> {
  const { results } = await db.prepare(`SELECT * FROM teams ORDER BY country ASC`).all<Team>();
  return results;
}

export async function upsertTeams(db: D1Database, teams: Team[]): Promise<void> {
  if (teams.length === 0) return;
  const stmt = db.prepare(
    `INSERT INTO teams (id, country, "group", flag, fifa_code, appearances_since_1930, last_appearance, wins_since_1930)
     VALUES (?,?,?,?,?,?,?,?)
     ON CONFLICT(id) DO UPDATE SET
       country=excluded.country, "group"=excluded."group", flag=excluded.flag,
       fifa_code=excluded.fifa_code, appearances_since_1930=excluded.appearances_since_1930,
       last_appearance=excluded.last_appearance, wins_since_1930=excluded.wins_since_1930`,
  );
  await db.batch(
    teams.map((t) =>
      stmt.bind(
        t.id,
        t.country,
        t.group,
        t.flag,
        t.fifa_code,
        t.appearances_since_1930,
        t.last_appearance,
        t.wins_since_1930,
      ),
    ),
  );
}

export async function upsertMatchStats(db: D1Database, rows: MatchStat[]): Promise<void> {
  if (rows.length === 0) return;
  const stmt = db.prepare(
    `INSERT INTO match_stats (fixture_id, team_id, goals, fouls, yellow_cards, red_cards, shots, shots_on_target)
     VALUES (?,?,?,?,?,?,?,?)
     ON CONFLICT(fixture_id, team_id) DO UPDATE SET
       goals=excluded.goals, fouls=excluded.fouls, yellow_cards=excluded.yellow_cards,
       red_cards=excluded.red_cards, shots=excluded.shots, shots_on_target=excluded.shots_on_target`,
  );
  await db.batch(
    rows.map((m) =>
      stmt.bind(
        m.fixture_id,
        m.team_id,
        m.goals,
        m.fouls,
        m.yellow_cards,
        m.red_cards,
        m.shots,
        m.shots_on_target,
      ),
    ),
  );
}

export async function upsertPlayers(db: D1Database, rows: Player[]): Promise<void> {
  if (rows.length === 0) return;
  const stmt = db.prepare(
    `INSERT INTO players (team_id, name, position, shirt_number) VALUES (?,?,?,?)
     ON CONFLICT(team_id, name) DO UPDATE SET position=excluded.position, shirt_number=excluded.shirt_number`,
  );
  await db.batch(rows.map((p) => stmt.bind(p.team_id, p.name, p.position, p.shirt_number)));
}

export async function getPlayersByTeam(db: D1Database, teamId: number): Promise<Player[]> {
  const { results } = await db
    .prepare(`SELECT * FROM players WHERE team_id = ? ORDER BY shirt_number ASC`)
    .bind(teamId)
    .all<Player>();
  return results;
}

export async function logSync(db: D1Database, source: string, status: string, requestsUsed: number): Promise<void> {
  await db
    .prepare(`INSERT INTO sync_log (ran_at, source, status, requests_used) VALUES (?,?,?,?)`)
    .bind(new Date().toISOString(), source, status, requestsUsed)
    .run();
}

export async function getLastSync(db: D1Database): Promise<{ ran_at: string } | null> {
  return db
    .prepare(`SELECT ran_at FROM sync_log WHERE status = 'ok' ORDER BY id DESC LIMIT 1`)
    .first<{ ran_at: string }>();
}

export async function getStandingForTeam(db: D1Database, teamId: number): Promise<Standing | null> {
  return db
    .prepare(
      `SELECT s.* FROM standings s
       JOIN teams t ON t.id = s.team_id AND s."group" = t."group"
       WHERE s.team_id = ? LIMIT 1`,
    )
    .bind(teamId)
    .first<Standing>();
}

export async function getNextGameForTeam(db: D1Database, teamId: number, nowIso: string): Promise<Fixture | null> {
  return db
    .prepare(
      `SELECT * FROM fixtures
              WHERE (home_team_id = ?1 OR away_team_id = ?1) AND datetime_utc >= ?2 AND status != 'finished'
              ORDER BY datetime_utc ASC LIMIT 1`,
    )
    .bind(teamId, nowIso)
    .first<Fixture>();
}
