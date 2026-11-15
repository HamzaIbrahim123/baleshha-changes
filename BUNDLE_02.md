# Bundle 02 — Neon database setup (initial draft)

**Purpose:** create a separate Neon database project and propose the first game/catalog/authentication schema.

## File path

- `database/drafts/001_neon_schema_draft.sql` — archived initial proposal (not executed).
- `database/README.md` — status and how it relates to Bundle 03.

## Neon project

- Name: `Baleshha - Games Platform`
- Project ID: `small-bar-10765505`
- Database: `baleshha`
- Branch: `main`
- Engine: PostgreSQL 17

**Important:** The later backend bundle includes the operative migration set in `backend/migrations/001_initial_schema.sql` and `backend/migrations/002_backend_support.sql`. **Do not run both initial schema files.** Neither migration was applied as part of this repository reorganization. There are no approved real questions/categories yet.

Neon: https://console.neon.tech/app/projects/small-bar-10765505
