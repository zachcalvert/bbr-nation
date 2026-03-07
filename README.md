# BBR Nation

A full-stack fantasy football league history app for a 10-year-old ESPN league. Syncs historical data from the ESPN Fantasy API and presents season stats, standings, matchup history, and a hall of fame — all tied to the real people who've played in the league.

## Features

- **Season history** — standings, records, and stats for every season synced from ESPN
- **Matchup history** — week-by-week results for every team across all seasons
- **Hall of fame** — all-time records, Championship Circle, Last Place Larrys, and season/matchup leaderboards
- **Roster history** — player-level roster data for each team per week
- **Group chat** — real-time chat room for league members (WebSocket)
- **Admin panel** — manage users, edit profiles, and map ESPN teams to league members

## Mobile-First Design

All user-facing pages are fully responsive and designed to work great on phones. On mobile (≤ 640px):

- Navigation collapses to a **hamburger menu** with a full-screen overlay
- Data tables reflow into **stacked cards** — each row becomes a labeled card with field name on the left and value on the right
- Grids (matchups, season cards) adapt fluidly using CSS `auto-fill` + `minmax()`
- Tab rows scroll horizontally rather than wrapping

**All new user-facing features must be built with mobile in mind.** This means:
- Add `data-label` attributes to every `<td>` in any new `data-table` (the CSS handles the rest)
- Avoid fixed widths; use fluid grids and `max-width` patterns
- Admin pages (`/admin`) are exempt — desktop-only is fine there

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router 7, TypeScript, Vite |
| Backend | Fastify 5, TypeScript |
| Database | PostgreSQL via Prisma ORM |
| Auth | Session-based (stored in `sessions` table) |
| Real-time | Native WebSocket via `@fastify/websocket` |
| Hosting | Fly.io (`bbr-nation`, `bbr-nation-db`) |

## Local Development

```bash
npm install
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

Credentials for local dev are in `prisma/seed.ts`.

## League Member Identity

Each league member is a `User` record. The key identifier is `groupme_id` — the member's ID in the league's GroupMe group chat, which has been active for the full history of the league. This is a stable, unique identifier that doesn't change across ESPN seasons.

ESPN teams (`espn_teams`) are linked to users via the `user_id` foreign key. This association is **set manually** through the admin panel — ESPN's API provides an `owner_espn_member_id` per team, but that value is not reliably consistent across seasons, so the link is managed by hand.

## Admin Panel

Available at `/admin` (admins only). Lets you:

- View all league member accounts
- Create new user accounts (name, email, password, GroupMe ID, favorite NFL team)
- Edit existing user profiles
- Link or unlink ESPN teams to a user across any season

## Database

Schema lives in `prisma/schema.prisma`. Migrations are written by hand — see `CLAUDE.md` for the workflow.

To seed local data from production:

```bash
# 1. Dump from prod (requires fly CLI + access)
fly ssh console --app bbr-nation-db
# Inside: PGPASSWORD=<pass> pg_dump -h localhost -p 5432 -U bbr_nation -d bbr_nation \
#   --data-only --exclude-table=sessions --no-privileges --no-owner -f /tmp/prod-seed.sql
exit
fly sftp get --app bbr-nation-db /tmp/prod-seed.sql prisma/prod-seed.sql

# 2. Wipe local data and load
psql -d bbr-nation -c "TRUNCATE espn_seasons, users CASCADE;"
psql -d bbr-nation -f prisma/prod-seed.sql
```

`prisma/prod-seed.sql` is gitignored (contains credentials).
