CREATE TABLE IF NOT EXISTS teams (
  id INTEGER PRIMARY KEY,
  country TEXT NOT NULL,
  "group" TEXT,
  flag TEXT,
  fifa_code TEXT,
  appearances_since_1930 INTEGER NOT NULL DEFAULT 0,
  last_appearance INTEGER,
  wins_since_1930 INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS fixtures (
  api_fixture_id INTEGER PRIMARY KEY,
  stage TEXT NOT NULL,
  "group" TEXT,
  datetime_utc TEXT NOT NULL,
  venue TEXT,
  city TEXT,
  home_team_id INTEGER,
  away_team_id INTEGER,
  status TEXT NOT NULL,
  elapsed_minute INTEGER,
  home_score INTEGER,
  away_score INTEGER,
  streaming_channel TEXT
);

CREATE TABLE IF NOT EXISTS standings (
  "group" TEXT NOT NULL,
  team_id INTEGER NOT NULL,
  played INTEGER NOT NULL DEFAULT 0,
  win INTEGER NOT NULL DEFAULT 0,
  loss INTEGER NOT NULL DEFAULT 0,
  draw INTEGER NOT NULL DEFAULT 0,
  gf INTEGER NOT NULL DEFAULT 0,
  ga INTEGER NOT NULL DEFAULT 0,
  gd INTEGER NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 0,
  rank INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY ("group", team_id)
);

CREATE TABLE IF NOT EXISTS match_stats (
  fixture_id INTEGER NOT NULL,
  team_id INTEGER NOT NULL,
  goals INTEGER NOT NULL DEFAULT 0,
  fouls INTEGER NOT NULL DEFAULT 0,
  yellow_cards INTEGER NOT NULL DEFAULT 0,
  red_cards INTEGER NOT NULL DEFAULT 0,
  shots INTEGER NOT NULL DEFAULT 0,
  shots_on_target INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (fixture_id, team_id)
);

CREATE TABLE IF NOT EXISTS players (
  team_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  position TEXT,
  shirt_number INTEGER,
  PRIMARY KEY (team_id, name)
);

CREATE TABLE IF NOT EXISTS sync_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ran_at TEXT NOT NULL,
  source TEXT NOT NULL,
  status TEXT NOT NULL,
  requests_used INTEGER NOT NULL DEFAULT 0,
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS sync_lock (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  locked_at TEXT
);

INSERT OR IGNORE INTO sync_lock (id, locked_at) VALUES (1, NULL);
