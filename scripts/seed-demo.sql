-- Demo fixtures and standings for local development without api-football key
INSERT INTO fixtures (api_fixture_id, stage, "group", datetime_utc, venue, city, home_team_id, away_team_id, status, elapsed_minute, home_score, away_score, streaming_channel)
VALUES
  (1001, 'Group Stage', 'A', datetime('now', 'start of day', '+14 hours'), 'MetLife Stadium', 'East Rutherford', 10, 20, 'scheduled', NULL, NULL, NULL, NULL),
  (1002, 'Group Stage', 'B', datetime('now', 'start of day', '+17 hours'), 'SoFi Stadium', 'Inglewood', 30, 40, 'live', 67, 1, 0, NULL)
ON CONFLICT(api_fixture_id) DO UPDATE SET
  status=excluded.status, elapsed_minute=excluded.elapsed_minute,
  home_score=excluded.home_score, away_score=excluded.away_score;

INSERT INTO standings ("group", team_id, played, win, loss, draw, gf, ga, gd, points, rank)
VALUES
  ('A', 10, 2, 2, 0, 0, 5, 1, 4, 6, 1),
  ('A', 20, 2, 1, 1, 0, 3, 3, 0, 3, 2),
  ('B', 30, 2, 1, 0, 1, 4, 2, 2, 4, 1),
  ('B', 40, 2, 0, 1, 1, 2, 3, -1, 1, 2),
  ('C', 50, 2, 2, 0, 0, 6, 2, 4, 6, 1),
  ('C', 60, 2, 1, 1, 0, 3, 4, -1, 3, 2),
  ('D', 70, 2, 1, 1, 0, 4, 3, 1, 3, 1),
  ('D', 80, 2, 1, 1, 0, 3, 3, 0, 3, 2)
ON CONFLICT("group", team_id) DO UPDATE SET
  played=excluded.played, win=excluded.win, loss=excluded.loss, draw=excluded.draw,
  gf=excluded.gf, ga=excluded.ga, gd=excluded.gd, points=excluded.points, rank=excluded.rank;

INSERT INTO sync_log (ran_at, source, status, requests_used)
VALUES (datetime('now'), 'api-football', 'ok', 2);

INSERT INTO players (team_id, name, position, shirt_number)
VALUES
  (10, 'Star Player', 'Attacker', 10),
  (10, 'Midfield Ace', 'Midfielder', 8),
  (30, 'Goal Keeper', 'Goalkeeper', 1)
ON CONFLICT(team_id, name) DO UPDATE SET position=excluded.position, shirt_number=excluded.shirt_number;
