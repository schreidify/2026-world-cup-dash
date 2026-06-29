CREATE TABLE fixtures_next (
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

INSERT INTO fixtures_next (
  api_fixture_id,
  stage,
  "group",
  datetime_utc,
  venue,
  city,
  home_team_id,
  away_team_id,
  status,
  elapsed_minute,
  home_score,
  away_score,
  streaming_channel
)
SELECT
  api_fixture_id,
  stage,
  "group",
  datetime_utc,
  venue,
  city,
  home_team_id,
  away_team_id,
  status,
  elapsed_minute,
  home_score,
  away_score,
  streaming_channel
FROM fixtures;

DROP TABLE fixtures;
ALTER TABLE fixtures_next RENAME TO fixtures;
