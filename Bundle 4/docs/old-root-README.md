# بلّشها — Baleshha Changes

This is the **source-and-changes** repository for the Baleshha games website. It contains actual files at their correct paths, **not** under a `bundles/` directory. The original [baleshha](https://github.com/HamzaIbrahim123/baleshha) repository is intentionally not modified.

## Project files (direct paths)

| Path | Purpose |
|---|---|
| `src/`, `index.html`, `package.json`, `vite.config.ts`, `tsconfig.json` | React + TypeScript + Vite frontend |
| `public/art/` | Four game illustrations |
| `backend/` | Node.js + Express + TypeScript API and its tests |
| `backend/migrations/` | **Canonical backend** PostgreSQL schema migrations, pending application |
| `database/drafts/` | Historical initial Neon schema proposal; **do not apply together with backend migration 001** |
| `.figma/make/` | Figma Make project scripts |
| `BUNDLE_01.md`, `BUNDLE_02.md`, `BUNDLE_03.md`, `BUNDLE_04.md` | Numbered changes, exact file paths and status |
| `BUNDLE_03_BACKEND.zip` | Optional downloadable archive of backend source |
| `docs/legacy/` | Archived notes and manifests from the previous folder layout |

## Change convention — keep this for future changes

**Every new change is Bundle 05, Bundle 06, ...**, in sequence.

1. Edit/add/delete real project files at their **normal root-relative paths**, such as `src/App.tsx` or `backend/src/routes.ts`.
2. Add a root-level `BUNDLE_05.md` (then `BUNDLE_06.md`, etc.) listing each changed path and whether it was added, modified, or deleted, and its purpose.
3. Make a Git commit named `Bundle 05 — ...` so Git history preserves that change; never create another `bundles/` wrapper directory.
4. Push changes **only to `HamzaIbrahim123/baleshha-changes`**, unless explicitly instructed otherwise.

## Run locally

- Frontend: `npm install && npm run dev`
- Backend: `cd backend && npm install && npm run dev`
- Backend setup/migrations: read [backend/README.md](backend/README.md), set a **private** server-side `backend/.env` from `backend/.env.example` before running migrations.

**Status:** Source is a working foundation, not a verified production deployment. The React frontend still uses local demo state and is **not wired to the API**. No vetted question bank is included. The Neon database was created, but migrations were **not applied** in this repository reorganization. Never commit tokens, credentials or a Neon connection URL.

Design source: https://www.figma.com/design/F8QbCCsYhe27xaDWFygUlK/Untitled?node-id=127-140
