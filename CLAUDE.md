# bbr-nation

Full-stack fantasy football league history app. The owner is a Django developer by trade — Django analogies are welcome and useful when explaining patterns.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router 7, TypeScript, Vite |
| Backend | Fastify 5, TypeScript, `tsx` for dev hot-reload |
| Database | PostgreSQL via Prisma ORM |
| Auth | Session-based (connect-pg-simple stores sessions in the `sessions` table) |
| Real-time | Native WebSocket via `@fastify/websocket` |

**Django analogies:**
- Fastify ≈ Django (the web framework, handles routing and middleware)
- Prisma schema ≈ `models.py` (source of truth for DB shape)
- Prisma migrations ≈ Django migrations (version-controlled SQL)
- Fastify plugins/routes ≈ Django apps with `urls.py` + `views.py`
- `request.session.userId` ≈ `request.user` (how you get the logged-in user in a route handler)
- `prisma.user.findUnique(...)` ≈ `User.objects.get(...)`

## Project Structure

```
server/
  index.ts          # App entry point — registers all plugins and route prefixes
  routes/           # One file per resource (auth, users, admin, espn, hallOfFame, chat)
  services/         # Business logic (espnSync, espnClient)
  ws/               # WebSocket channel handlers
src/
  pages/            # One component per route (≈ Django views/templates)
  components/       # Shared UI components
  context/          # React context (AuthContext holds the logged-in user)
  App.tsx           # React Router route tree
prisma/
  schema.prisma     # Data model (edit this when changing the DB schema)
  migrations/       # SQL migration files (see workflow below)
```

## Dev Server

```bash
npm run dev
```

This runs two processes concurrently via `concurrently`:
- **Server**: Fastify on `:3001` (hot-reloaded by `tsx watch`)
- **Client**: Vite on `:5173` (proxies `/api` and `/ws` to `:3001`)

The preview tool uses the `dev` configuration in `.claude/launch.json`.

## Database Migrations

**Always write migrations by hand.** Do not use `prisma migrate dev` (it's interactive and doesn't work well in this environment).

### Workflow for schema changes:
1. Edit `prisma/schema.prisma`
2. Create a new migration directory with a timestamp name:
   ```
   prisma/migrations/YYYYMMDDHHMMSS_describe_the_change/migration.sql
   ```
   Use the pattern from existing migrations for the timestamp format. Increment the last digits if creating multiple in one session (e.g. `...000003`, `...000004`).
3. Write the SQL manually in `migration.sql`
4. Apply it:
   ```bash
   npx prisma migrate deploy
   ```

### Common SQL patterns
```sql
-- Add a nullable column
ALTER TABLE "users" ADD COLUMN "avatar_url" TEXT;

-- Add a non-nullable column with a default
ALTER TABLE "users" ADD COLUMN "display_name" TEXT NOT NULL DEFAULT '';

-- Drop a column
ALTER TABLE "users" DROP COLUMN "espn_id";

-- Add a unique index
ALTER TABLE "users" ADD CONSTRAINT "users_groupme_id_key" UNIQUE ("groupme_id");
```

## API Route Conventions

Routes are registered in `server/index.ts` with a prefix, then handled in `server/routes/<resource>.ts`:

```
GET  /api/users/me               → userRoutes
GET  /api/users/profile/:userId  → userRoutes
GET  /api/admin/                 → adminRoutes (admin-only)
GET  /api/espn/seasons/:year     → espnRoutes
```

**Auth check pattern:**
```ts
// Simple auth — any logged-in user
if (!request.session.userId) return reply.status(401).send({ error: "Not authenticated" });

// Admin-only — use the checkAdmin helper in admin.ts
if (!(await checkAdmin(request, reply))) return;
```

## Frontend Conventions

- Pages live in `src/pages/`, one file per route
- `useAuth()` from `AuthContext` gives access to the logged-in user (`user.id`, `user.firstName`, etc.)
- Data fetching is done inline in `useEffect` with `fetch()` — no external data-fetching library
- Styles use CSS classes defined globally (e.g. `page`, `section`, `card`, `data-table`, `team-link`, `hof-manager`, `muted`, `champion-row`)
- New routes must be added to the `<Routes>` tree in `src/App.tsx`

## Key CSS Classes (for consistent UI)

| Class | Use |
|---|---|
| `page` | Top-level page wrapper |
| `page-header` | Title/meta section at top of page |
| `section` | Content section with margin |
| `card` / `card table-card` | Bordered card, use `table-card` when it directly wraps a table |
| `data-table` | Standard `<table>` styling |
| `team-link` | Inline logo + name link (used in tables) |
| `team-link-plain` | Plain text link, no logo treatment |
| `hof-manager` | Small subdued manager name shown below a team name in a table |
| `champion-row` | Gold highlight row for the champion |
| `last-place-row` | Subdued highlight for last place |
| `muted` | Greyed-out text |
| `loading-screen` | Full-page loading state |
| `empty-state` | Centered empty/error state |
| `breadcrumb` / `breadcrumb-sep` | Breadcrumb navigation |
