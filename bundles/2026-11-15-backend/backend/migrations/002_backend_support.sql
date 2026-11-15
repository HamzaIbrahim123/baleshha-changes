-- Apply AFTER bundles/2026-11-15-neon-db/migrations/001_initial_schema.sql
-- This is safe to re-run. Never commit a DATABASE_URL or password.
BEGIN;
CREATE TABLE IF NOT EXISTS auth_sessions (
  token_hash char(64) PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz
);
CREATE INDEX IF NOT EXISTS auth_sessions_user_idx ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS auth_sessions_expiration_idx ON auth_sessions(expires_at);

ALTER TABLE match_questions ADD COLUMN IF NOT EXISTS revealed_at timestamptz;

CREATE TABLE IF NOT EXISTS match_help_uses (
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  question_id uuid NOT NULL,
  team_number smallint NOT NULL CHECK(team_number IN (1,2)),
  help_type varchar(30) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (match_id,question_id),
  FOREIGN KEY (match_id,question_id) REFERENCES match_questions(match_id,question_id) ON DELETE CASCADE,
  FOREIGN KEY (match_id,team_number,help_type) REFERENCES match_helps(match_id,team_number,help_type) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS score_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  team_number smallint NOT NULL CHECK(team_number IN (1,2)),
  question_id uuid,
  delta integer NOT NULL,
  reason varchar(25) NOT NULL CHECK(reason IN ('question','pit_penalty','trap_penalty','manual')),
  idempotency_key uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (match_id,team_number) REFERENCES match_teams(match_id,team_number) ON DELETE CASCADE,
  FOREIGN KEY (match_id,question_id) REFERENCES match_questions(match_id,question_id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS score_events_idempotency_uq ON score_events(match_id,idempotency_key)
  WHERE idempotency_key IS NOT NULL;
COMMIT;
