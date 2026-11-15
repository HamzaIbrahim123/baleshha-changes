# Bundle 5 — Verified file changes against uploaded baleshha-main.zip

**This is the actual delta**, compared byte-by-byte with the user-supplied original ZIP.

- Original ZIP: 37 files under `baleshha-main/`.
- Existing React/frontend source: 17 identical files; zero new frontend files.
- Backend: 17 **new** files, placed directly at `backend/...` in this folder; none overwrite existing original files.
- Three differing frontend configuration files (`.gitattributes`, `.gitignore`, `vite.config.ts`) are intentionally NOT part of this ready-to-apply delta. The original `vite.config.ts` includes Figma Make platform-specific plugins. Overwriting it with the simplified alternative is unsafe.
- The old Neon initial schema draft (Bundle 2) is **superseded** by the backend's canonical `backend/migrations/001_initial_schema.sql` and `002_backend_support.sql`. Do not apply both versions.

## Apply
This folder contains the same project-relative paths you would use in the original repository. If you want to inspect the code, look under `backend/`. Do **not** replace the existing `src/`, `public/`, `vite.config.ts`, or original Make configuration.

**Important:** Node.js/Express backend cannot become a server simply by copying it into the static Figma Make frontend. It requires separate server hosting, a private server-only Neon database URL, and a secure integration step. Migrations have not been applied. No real question bank has been added.

## Files
- `backend/.env.example`
- `backend/.gitignore`
- `backend/README.md`
- `backend/migrations/001_initial_schema.sql`
- `backend/migrations/002_backend_support.sql`
- `backend/package.json`
- `backend/src/app.ts`
- `backend/src/auth.ts`
- `backend/src/config.ts`
- `backend/src/db.ts`
- `backend/src/errors.ts`
- `backend/src/migrate.ts`
- `backend/src/routes.ts`
- `backend/src/rules.ts`
- `backend/src/server.ts`
- `backend/tests/rules.test.ts`
- `backend/tsconfig.json`

Manifest: `bundle-manifest.json`. This repository's other Bundle 1–4 folders are historical snapshots, not the user-specific delta.
