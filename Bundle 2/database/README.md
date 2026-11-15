# Neon database sources — Baleshha

Created project: https://console.neon.tech/app/projects/small-bar-10765505

The historical first SQL proposal is kept **for reference only** at:
- `database/drafts/001_neon_schema_draft.sql`

The authoritative migration scripts for the later backend live at:
- `backend/migrations/001_initial_schema.sql`
- `backend/migrations/002_backend_support.sql`

**Do not execute both initial schemas.** The backend supports account/session and match APIs, but is not yet deployed. Schema migration has not been applied to Neon during this repository restructuring. When ready, follow `backend/README.md` using a private server-side `DATABASE_URL`. Never commit connection strings or passwords.
