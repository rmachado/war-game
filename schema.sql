CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  player_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'waiting',
  winner TEXT,
  finished_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
