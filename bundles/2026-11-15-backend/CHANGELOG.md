# Baleshha Backend Bundle — 2026-11-15

Repository target: `HamzaIbrahim123/baleshha-changes`, bundle-only update.
The original `HamzaIbrahim123/baleshha` repository is not modified.

## Added
- Standalone Node.js / Express / TypeScript API under `backend/`.
- Password-based authentication (username + name, no email), Argon2id hashing and PostgreSQL-backed HttpOnly sessions.
- Public games/categories APIs, per-account remaining game counts and authenticated match endpoints.
- 4/6/8 category validation, two verified questions per 200/400/600 tier, transactional reservation, reusing unseen questions on abandonment.
- Oral question reveal, scoring, pit/trap baseline rules, helper activation, +/-200 manual correction, winner or tie result.
- Neon PostgreSQL migrations: original initial schema plus additive backend sessions/score event migration.
- Example environment file, migration runner, unit tests, setup/API documentation.

## Deferred on purpose
- No real questions, categories, or answer imports.
- No frontend wiring or deployment yet; React continues to use demo data until separately integrated.
- Rule verification and UI-specific help-edge cases still require the user's eventual question-bank/rules pass.
- Live Neon schema deployment should only be marked complete after executed migrations and checks.

## Validation
- TypeScript source syntax transpilation: passed on all source and test files.
- Full dependency install, typecheck and live Neon tests require a network-connected Node environment.

## Start
`cd backend && npm install && cp .env.example .env && npm run migrate && npm run dev`

Keep DATABASE_URL and other credentials in backend environment variables, NEVER in GitHub.
