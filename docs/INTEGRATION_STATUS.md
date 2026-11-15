# Baleshha integration checklist — 2026-11-15

## Verified
- Neon project `small-bar-10765505`, branch `main`, database `baleshha`: 14 tables.
- `schema_migrations`: 001 and 002 recorded.
- `games`: four seeded names.
- `app_users`: 0 at time of migration; no accounts imported from local browser storage.
- Frontend auth was changed to server-based API requests. Syntax transpilation checked.

## Not yet verified / not deployed
- Node.js/Express backend hosting and `/api/health` over HTTPS.
- Figma Make actual running preview using new code.
- Cross-origin/same-site proxy needed for HttpOnly session cookie use.
- Real registration/login request via the running website and a database account row.
- Games and question consumption are still local demo logic in React.

## Deployment sequence
1. Deploy `backend/` to an HTTPS Node.js host; configure private `DATABASE_URL` and `NODE_ENV=production`, `COOKIE_SECURE=true`, `FRONTEND_ORIGIN` to the actual web origin. Never expose secrets to Figma Make or frontend.
2. Confirm `/api/health` responds and requests on the site's `/api` route reach the backend through a same-origin reverse proxy. Local Vite automatically proxies to `http://localhost:4000` (or `BALESHHA_API_PROXY_TARGET`).
3. Use the revised `src/App.tsx`, `src/api.ts` and `vite.config.ts` in Figma Make. Backend source does not automatically run in a Figma Make static preview.
4. Register a brand-new testing user from the website, check `app_users` and `auth_sessions` counts via Neon, sign out and sign in on another browser/device, and only then declare real accounts working.
5. Defer real questions/category setup and match-state migration until explicitly requested.
