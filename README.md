# بلّشها — Baleshha Changes

**كل تعديل في فولدر مستقل ظاهر في الصفحة الرئيسية.** This repo contains numbered change folders (not one merged project at the root).

| Folder | What's inside |
|---|---|
| [Bundle 1](Bundle%201/) | Frontend: React/Vite website, Figma Make scripts, four game visuals |
| [Bundle 2](Bundle%202/) | Initial Neon database draft |
| [Bundle 3](Bundle%203/) | Node.js/Express/TypeScript backend, migrations, tests, ZIP |
| [Bundle 4](Bundle%204/) | Repository organization change and earlier notes |

Each Bundle folder keeps files under their **original relative path** so the changed files can be copied into a project without guessing where they go.

Example:
```text
Bundle 1/
  src/App.tsx
  src/data.ts
  public/art/seen-jeem.webp
  package.json

Bundle 2/
  database/drafts/001_neon_schema_draft.sql

Bundle 3/
  backend/src/routes.ts
  backend/migrations/001_initial_schema.sql

Bundle 4/
  README.md
```

## From now on
- Every new set of changes gets a **NEW root folder**: `Bundle 5/`, `Bundle 6/`, and so on.
- Put **only added or changed files** inside that folder using their real intended project paths. Add `README.md` in the same folder documenting changed paths and how to apply them.
- **Do not** create another `bundles/` wrapper or scatter `BUNDLE_XX.md` documents at the root.
- Upload to **this changes repository only**; the original [baleshha](https://github.com/HamzaIbrahim123/baleshha) repository remains unchanged unless explicitly requested.
- Do not include credentials. Current frontend uses local demo data; backend and Neon migration are not yet deployed or integrated. Questions will be provided later.

[Approved Figma designs](https://www.figma.com/design/F8QbCCsYhe27xaDWFygUlK/Untitled?node-id=127-140)
