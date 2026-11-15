# Bundle 3 — Backend

**What changed:** Created the Node.js + Express + TypeScript backend source and database migrations. Includes username/password auth with password hashes and sessions, games/categories endpoints, matches, scores, helps and per-account question usage.

**Files to apply into a project:**
- `backend/package.json`, `backend/tsconfig.json`, `backend/.env.example`, `backend/.gitignore`
- `backend/src/` — app, auth, config, database, routes, game rules and server
- `backend/migrations/001_initial_schema.sql`, `backend/migrations/002_backend_support.sql`
- `backend/tests/rules.test.ts`
- `BACKEND_BUNDLE.zip` is an optional copy of the backend source. Do not apply the ZIP *and* directory as two separate changes.

Detailed setup and API endpoints: `backend/README.md`. Prior change notes: `BUNDLE_03.md` and `docs/legacy/backend-bundle-changelog.md`.

**Run a local standalone backend:** `cd "Bundle 3/backend" && npm install && npm run dev` after configuring a private `.env`. Apply migrations only after reviewing and testing. **No approved questions, no live Neon migration, no frontend integration or deployment yet.** Never commit `DATABASE_URL`.
