CREATE TABLE budget_state (
  user_id TEXT PRIMARY KEY NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
  revision INTEGER NOT NULL CHECK (revision >= 1),
  data TEXT NOT NULL CHECK (json_valid(data)),
  updated_at TEXT NOT NULL,
  last_mutation_id TEXT NOT NULL
);
