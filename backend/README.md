# Baleshha Backend — Node.js + Express + TypeScript + Neon

> **Neon database status — 2026-11-15:** Migrations 001 and 002 were applied to the `baleshha` database on Neon project `small-bar-10765505` (14 tables verified). The API is **not deployed**, and this repository's React frontend auth integration is code-only until backend HTTPS hosting and same-origin routing are configured. No real account has been registered by the website yet.

**Backend implementation bundle** (not deployed). This bundle belongs in `HamzaIbrahim123/baleshha-changes` only. Do not copy it over the root `HamzaIbrahim123/baleshha` repository until an explicit deployment/integration step is approved.

## What works when Neon migrations are applied

- **Username/password authentication without email or OAuth.** Requires display name on registration and username/password on login. Argon2id password hashes, opaque 30-day `HttpOnly` sessions in PostgreSQL, origin checks, CORS allowlist, rate limiting.
- **Public game and category browsing.** Shared account for all games. Per-user count of complete 6-question matches in each category (`MIN(FLOOR(available_200/2),...)`).
- **Seen Jeem match lifecycle.** Validate 4/6/8 distinct selected categories, two teams, three distinct selected helps each. Reserve 2 verified unused questions at each tier (200/400/600) per category, atomically; prevent beginning a new match until the current one is abandoned with confirmation.
- **Question lifecycle.** `reserved` -> `shown` -> `resolved`. A question becomes used by the account on **display**, not reservation; unseen reservations return to the pool on abandonment. Answer never accompanies the opening-question response; it is revealed in a separate endpoint.
- **Scores and helpers.** Score by 200/400/600, no winner or winner team; pit deducts the same points from the opponent on a correct answer by the activating team; trap passes the question and penalizes opponent if unanswered/incorrect. One help action per question; 3 chosen per team. +/-200 manual score correction with a mandatory per-request `Idempotency-Key` UUID.
- **Result:** the finish endpoint returns only the winner's name and score, or a tie score, matching the approved screen.

## What remains intentionally pending

**No real categories or questions added.** With empty question bank, the `POST /api/matches` endpoint correctly returns HTTP 409 `QUESTION_BANK_NOT_READY`, rather than inventing questions. Actual original Seen Jeem help-tool wording and edge cases must be confirmed before production; the current implementations of `pit` and `trap` encode the user-agreed baseline. `call_friend`, `two_answers`, and `rest` are tracked but have no automated restrictions on spoken conversation. Other game rules will be separate modules.

The **existing React demo frontend is NOT connected** to this API and still uses its local demo state. Integration is a separate step. This backend has **NOT been deployed as a running HTTPS service** in this bundle. The database migrations were applied separately on Neon. Do not mistake the UI demo for production authorization or question tracking.

## Setup

1. In `backend/`, run `npm install` on Node.js >=20.11.
2. Copy `.env.example` to `.env` and paste a **server-only** Neon connection string. Never commit `.env` or put it in Figma Make/browser code.
3. Run `npm run migrate` to apply `001_initial_schema.sql` and `002_backend_support.sql` with transaction-safe migration tracking.
4. Run `npm run dev` (default port 4000). `npm run build`, `npm test` for verification.
5. Run React via Vite on `http://localhost:5173`. For production, deploy frontend and `/api` under one site over HTTPS (HttpOnly Lax cookies), set `COOKIE_SECURE=true`, and use `FRONTEND_ORIGIN` for the exact allowed origin.

**DB note:** Neon PostgreSQL is not an HTTP REST API. Never connect to it directly from React; this server is the boundary. The database migration contains only game names, not categories, questions, personal data or passwords.

## API endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | DB connection health |
| POST | `/api/auth/register` | `{displayName,username,password}` and create session |
| POST | `/api/auth/login` | `{username,password}` and create session |
| GET/POST | `/api/auth/me`, `/api/auth/logout` | Session read/logout |
| GET | `/api/games` | Public game library |
| GET | `/api/games/seen-jeem/categories` | Public categories; signed-in account remaining counts |
| GET | `/api/matches/current` | Current Seen Jeem match, if any |
| POST | `/api/matches` | `{categoryIds:[...],teamNames:[nameA,nameB],teamHelps:[[...],[...]]}` |
| GET | `/api/matches/:id` | Match board without question/answer spoilers |
| POST | `/api/matches/:id/abandon` | `{confirm:true}`; release unshown questions |
| POST | `/api/matches/:id/questions/:questionId/open` | Open and mark question used |
| POST | `/api/matches/:id/questions/:questionId/reveal` | Reveal answer after spoken responses |
| POST | `/api/matches/:id/questions/:questionId/resolve` | `{awardedTeam:1\|2\|null}`; award and move turn |
| POST | `/api/matches/:id/helps/select` | `{teamNumber,questionId,helpType}` (pit before open) |
| POST | `/api/matches/:id/helps/use` | Same body, consume selected help |
| POST | `/api/matches/:id/teams/:teamNumber/adjust` | `{delta:200\|-200}`, `Idempotency-Key: <UUID>` |
| POST | `/api/matches/:id/finish` | `{confirm:true}`; winner or tie only |

All write endpoints require the correct account/session except registration and login. Auth cookies and origin restrictions apply. A help is used once and one help action is supported per question in this starter. Questions are never fetched without an authenticated match. Backend errors use `{error:{code,message}}`.

## Example

```bash
curl -i http://localhost:4000/api/games
curl -i -c cookies.txt -H 'Content-Type: application/json' -X POST http://localhost:4000/api/auth/register \
  -d '{"displayName":"حمزة","username":"hamza_demo","password":"my-long-secret-passphrase"}'
curl -b cookies.txt http://localhost:4000/api/auth/me
```

`cookies.txt` and `.env` are private and must not be committed.
