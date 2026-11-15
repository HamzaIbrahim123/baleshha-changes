# Bundle 04 — Repository restructuring to direct paths

**Requested change:** show all project files from the repository root, not nested under `bundles/2026-11-15...`. Preserve the original `baleshha` repository.

## Moved (same Git blob content)

- Previous frontend snapshot `bundles/2026-11-15/src/*` → `src/*`
- `bundles/2026-11-15/public/art/*` → `public/art/*`
- Frontend root config and `.figma/make/*` → corresponding root paths
- Backend snapshot `bundles/2026-11-15-backend/backend/*` → `backend/*`
- Backend ZIP → root `BUNDLE_03_BACKEND.zip`
- Earlier Neon draft `bundles/2026-11-15-neon-db/migrations/001_initial_schema.sql` → `database/drafts/001_neon_schema_draft.sql`
- Old bundle notes, manifests and original README files → `docs/legacy/` or `docs/`

## Added/updated

- `README.md` — new root navigation and instructions
- `CHANGELOG.md` — numbered bundle history
- `BUNDLE_01.md`, `BUNDLE_02.md`, `BUNDLE_03.md`, `BUNDLE_04.md`
- `database/README.md`
- Removed old directory tree `bundles/` after moving **all source and archived notes**.

## Next convention

Every change after this is **Bundle 05, Bundle 06, ...**, committed to Git and accompanied by a root-level `BUNDLE_XX.md` listing exact changed paths. Source files themselves always stay in their normal paths and are not duplicated in a nested bundle directory.
