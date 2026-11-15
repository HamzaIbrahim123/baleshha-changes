-- Baleshha / بلّشها — initial PostgreSQL schema
-- Prepared for Neon database: baleshha (PostgreSQL 17)
-- Run via a migration tool against a direct DATABASE_URL; not yet applied.
-- All passwords MUST be salted and hashed in the application backend (Argon2id recommended).
-- Do not connect to the database directly from browser JavaScript.

BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name varchar(100) NOT NULL CHECK (length(btrim(display_name)) BETWEEN 1 AND 100),
  username varchar(50) NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT username_format CHECK (username ~ '^[A-Za-z0-9_.-]{3,50}$')
);
CREATE UNIQUE INDEX IF NOT EXISTS app_users_username_ci_uq ON app_users (lower(username));

CREATE TABLE IF NOT EXISTS games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(70) NOT NULL UNIQUE,
  title_ar varchar(120) NOT NULL,
  description_ar text,
  status varchar(20) NOT NULL DEFAULT 'coming_soon'
    CHECK (status IN ('active','coming_soon','hidden')),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES games(id) ON DELETE RESTRICT,
  parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  slug varchar(80) NOT NULL,
  title_ar varchar(150) NOT NULL,
  image_path text,
  enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  UNIQUE(game_id,slug),
  UNIQUE(id,game_id)
);
CREATE INDEX IF NOT EXISTS categories_game_idx ON categories(game_id,enabled,sort_order);

CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  points smallint NOT NULL CHECK (points IN (200,400,600)),
  question_text text NOT NULL CHECK(length(btrim(question_text)) > 0),
  answer_text text NOT NULL CHECK(length(btrim(answer_text)) > 0),
  source_reference text,
  review_status varchar(20) NOT NULL DEFAULT 'draft'
    CHECK (review_status IN ('draft','verified','rejected')),
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(id,category_id)
);
CREATE INDEX IF NOT EXISTS questions_category_points_idx ON questions(category_id,points,review_status,enabled);

CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  game_id uuid NOT NULL REFERENCES games(id) ON DELETE RESTRICT,
  category_count smallint NOT NULL CHECK (category_count IN (4,6,8)),
  status varchar(20) NOT NULL DEFAULT 'setup'
    CHECK (status IN ('setup','active','finished','abandoned')),
  current_turn smallint NOT NULL DEFAULT 1 CHECK (current_turn IN (1,2)),
  winner_team smallint CHECK (winner_team IN (1,2)),
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(id,user_id)
);
-- Only one unfinished match per account for Seen Jeem, enforced for all games as a simple starter.
CREATE UNIQUE INDEX IF NOT EXISTS matches_one_unfinished_per_user_game
  ON matches(user_id,game_id) WHERE status IN ('setup','active');

CREATE TABLE IF NOT EXISTS match_categories (
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  selection_order smallint NOT NULL,
  PRIMARY KEY(match_id,category_id),
  UNIQUE(match_id,selection_order)
);

CREATE TABLE IF NOT EXISTS match_teams (
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  team_number smallint NOT NULL CHECK(team_number IN (1,2)),
  team_name varchar(80) NOT NULL,
  score integer NOT NULL DEFAULT 0,
  PRIMARY KEY(match_id,team_number)
);

CREATE TABLE IF NOT EXISTS match_helps (
  match_id uuid NOT NULL,
  team_number smallint NOT NULL,
  help_type varchar(30) NOT NULL
    CHECK(help_type IN ('call_friend','pit','two_answers','rest','trap')),
  status varchar(20) NOT NULL DEFAULT 'available'
    CHECK(status IN ('available','selected','used')),
  used_at timestamptz,
  PRIMARY KEY(match_id,team_number,help_type),
  FOREIGN KEY(match_id,team_number) REFERENCES match_teams(match_id,team_number) ON DELETE CASCADE
);

-- 'reserved' means not yet displayed; only shown/resolved questions count as used.
-- Deleting/abandoning an unfinished match must release reserved questions.
CREATE TABLE IF NOT EXISTS match_questions (
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
  category_id uuid NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'reserved'
    CHECK(status IN ('reserved','shown','resolved')),
  shown_at timestamptz,
  resolved_at timestamptz,
  awarded_team smallint CHECK(awarded_team IN (1,2)),
  awarded_points integer NOT NULL DEFAULT 0,
  PRIMARY KEY(match_id,question_id),
  FOREIGN KEY(match_id,category_id) REFERENCES match_categories(match_id,category_id) ON DELETE CASCADE,
  FOREIGN KEY(question_id,category_id) REFERENCES questions(id,category_id) ON DELETE RESTRICT
);

-- Permanent per-account usage history, without storing a user-visible match history.
CREATE TABLE IF NOT EXISTS used_questions (
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
  first_shown_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id,question_id)
);

CREATE INDEX IF NOT EXISTS matches_user_created_idx ON matches(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS match_questions_status_idx ON match_questions(match_id,status);

-- Public catalog can be browsed without login; starting a match requires an app session.
INSERT INTO games(slug,title_ar,status,sort_order) VALUES
 ('seen-jeem','سين جيم','active',1),
 ('codenames','كود نيمز','coming_soon',2),
 ('letter-play','لعب الحروف','coming_soon',3),
 ('thirty-challenge','تحدي الثلاثين','coming_soon',4)
ON CONFLICT(slug) DO UPDATE SET title_ar=excluded.title_ar;
COMMIT;
