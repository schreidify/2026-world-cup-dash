ALTER TABLE sync_log ADD COLUMN error_message TEXT;

CREATE TABLE IF NOT EXISTS sync_lock (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  locked_at TEXT
);

INSERT OR IGNORE INTO sync_lock (id, locked_at) VALUES (1, NULL);
