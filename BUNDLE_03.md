# Bundle 03 — Backend API (Node.js / Express / TypeScript)

**Purpose:** build source for username/password accounts, shared sessions, Neon persistence, Seen Jeem matches, help actions, question reuse rules, scores and result state.

## Added project files

- `backend/.env.example` — configuration example; no real secrets
- `backend/.gitignore`
- `backend/README.md` — endpoint and setup reference
- `backend/package.json`
- `backend/tsconfig.json`
- `backend/src/app.ts`
- `backend/src/auth.ts`
- `backend/src/config.ts`
- `backend/src/db.ts`
- `backend/src/errors.ts`
- `backend/src/migrate.ts`
- `backend/src/routes.ts`
- `backend/src/rules.ts`
- `backend/src/server.ts`
- `backend/migrations/001_initial_schema.sql` — **canonical** initial database migration
- `backend/migrations/002_backend_support.sql` — session/score infrastructure
- `backend/tests/rules.test.ts`
- `BUNDLE_03_BACKEND.zip` — optional archive copy

## Status

Source ready for installation and integration, **not deployed and not connected to frontend**. Read `backend/README.md` for `npm install`, private `DATABASE_URL`, migrations, server endpoints, tests and limits. Database credentials never belong in this repository. Questions will be added later after user approval.

A copy of the previous backend changelog is preserved under `docs/legacy/backend-bundle-changelog.md`.
