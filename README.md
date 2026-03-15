# BBR Nation

A full-stack fantasy football league history app. Plug in your ESPN league credentials and it will sync historical data from the ESPN Fantasy API — season stats, standings, matchup history, and a hall of fame — all tied to the real people in your league.

## Features

- **Season history** — standings, records, and stats for every season synced from ESPN
- **Matchup history** — week-by-week results for every team across all seasons
- **Hall of fame** — all-time records, Championship Circle, last place history, and season/matchup leaderboards
- **Roster history** — player-level roster data for each team per week
- **Group chat** — real-time chat room for league members (WebSocket)
- **Admin panel** — manage users, edit profiles, and map ESPN teams to league members

## Mobile-First Design

All user-facing pages are fully responsive and designed to work great on phones. On mobile (≤ 640px):

- Navigation collapses to a **hamburger menu** with a full-screen overlay
- Data tables reflow into **stacked cards** — each row becomes a labeled card with field name on the left and value on the right
- Grids (matchups, season cards) adapt fluidly using CSS `auto-fill` + `minmax()`
- Tab rows scroll horizontally rather than wrapping

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router 7, TypeScript, Vite |
| Backend | Fastify 5, TypeScript |
| Database | PostgreSQL via Prisma ORM |
| Auth | Session-based (stored in `sessions` table) |
| Real-time | Native WebSocket via `@fastify/websocket` |

## Getting Started

### 1. Prerequisites

- Node.js 18+
- PostgreSQL (running locally or via Docker)

### 2. Clone and install

```bash
git clone <repo-url>
cd bbr-nation
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in:

- **`DATABASE_URL`** — your Postgres connection string
- **`SESSION_SECRET`** — a long random string for cookie signing
- **`ESPN_LEAGUE_ID`** — your ESPN league ID (from the league URL on espn.com)
- **`ESPN_S2`** and **`ESPN_SWID`** — authentication cookies for private ESPN leagues (see below)
- **`ESPN_LEAGUE_START_YEAR`** — the first year your league existed (for historical backfill)

#### Finding ESPN cookies

If your league is private, you need the `espn_s2` and `SWID` cookies:

1. Log in to [espn.com](https://www.espn.com) in your browser
2. Open DevTools → Application → Cookies → `espn.com`
3. Copy the values for `espn_s2` and `SWID`

### 4. Set up the database

```bash
npx prisma migrate deploy
```

### 5. Seed example users

Edit `prisma/seed.ts` to add your league members (name, email, password, favorite team), then:

```bash
npm run db:seed
```

### 6. Run the app

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### 7. Sync ESPN data

1. Log in as an admin user
2. Go to `/admin` and click **"Backfill all seasons"**
3. Use the admin panel to map ESPN teams to user accounts

## Database

Schema lives in `prisma/schema.prisma`. Migrations are written by hand — see `CLAUDE.md` for the workflow.

## Deployment

The project includes a `fly.toml` for deploying to [Fly.io](https://fly.io). To deploy your own instance:

```bash
fly launch          # creates your app + Postgres on Fly
fly secrets set \
  SESSION_SECRET="..." \
  ESPN_LEAGUE_ID="..." \
  ESPN_S2="..." \
  ESPN_SWID="..." \
  ESPN_LEAGUE_START_YEAR="..."
fly deploy
```

## License

MIT
