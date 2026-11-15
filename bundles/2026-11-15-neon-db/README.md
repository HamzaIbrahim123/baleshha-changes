# Baleshha — Neon Database Bundle 001

Neon project: **Baleshha - Games Platform** (`small-bar-10765505`)
Database: `baleshha` · Branch: `main` · PostgreSQL 17 · Region: `aws-eu-central-1`

This bundle is the initial migration proposal, **not executed on the live database**. Run it through a backend migration runner against a direct Neon connection only after reviewing and testing. The existing `HamzaIbrahim123/baleshha` repository must remain unchanged; changes belong only in `HamzaIbrahim123/baleshha-changes`.

## Purpose
- One username/password account for every game (no email required); the server must hash passwords, manage signed sessions, rate-limit login, and enforce account ownership.
- Public game/category browsing; login required to start a match.
- Seen Jeem categories with two 200-point, two 400-point and two 600-point questions each.
- Per-account question usage: only questions *shown* to an account are permanently marked as used; never-shown reserved questions must be released if the match is abandoned.
- Matches, two teams, alternating turns, selected three of five help tools, scoring and optional tie.
- Other games share users/catalog but can have their own rules and tables later.

## Important constraints / remaining implementation
1. The database does not implement game logic or user authentication alone. API code must validate exactly 4/6/8 categories, exactly two questions at each point level, exactly three distinct helps/team, and full help-tool rules and scoring.
2. **Never** expose `DATABASE_URL` or password hashes in frontend or GitHub. Use backend environment variables and a secure server API.
3. Question quality needs a verified editorial workflow (`review_status='verified'`) before display.
4. Use transactions and row locks or conflict-safe selection to prevent question reuse for a user and concurrent matches.
5. No questions are inserted yet; only the four agreed game names are seeded in this draft migration.

## File
`migrations/001_initial_schema.sql`
