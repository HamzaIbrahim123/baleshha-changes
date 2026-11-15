# Baleshha Changes — numbered history

**No dated `bundles/` wrapper directories.** The repository root now contains the actual source tree, and each change is documented in a root-level `BUNDLE_XX.md` file.

| Bundle | Scope | Files | Status |
|---|---|---|---|
| [Bundle 01](BUNDLE_01.md) | React/Vite website, Figma Make scaffold, four game illustrations | `src/`, `public/`, root app configs, `.figma/` | Interactive prototype; account state is local |
| [Bundle 02](BUNDLE_02.md) | Neon project and first schema proposal | `database/drafts/` | Neon created; first SQL is archived as a draft |
| [Bundle 03](BUNDLE_03.md) | Express + TypeScript backend and revised schema migrations | `backend/` | Backend source ready for integration/testing; not deployed |
| [Bundle 04](BUNDLE_04.md) | Flatten previous nested bundle snapshots to real project paths | Repository reorganization and version index | Complete |

Future change: update the affected files **in place**, add `BUNDLE_05.md` with their exact paths, commit as `Bundle 05 — ...`, then continue numbering. Do not modify the original `baleshha` repository.
