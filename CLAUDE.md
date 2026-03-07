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

Use `preview_start` with the `"dev"` configuration to verify UI changes after edits. The app requires authentication, so use `preview_snapshot` and `preview_inspect` for structure/style checks rather than trying to interact with authenticated pages.

Local dev credentials (for API testing, curl, etc.) can be found in `prisma/seed.ts`.

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

## Data Model: Users and ESPN Teams

Each league member is a `User` record. The key identifier is `groupmeId` — the member's ID in the league's GroupMe group chat, which has been active for the entire history of the league. It is unique and stable across seasons.

ESPN teams (`EspnTeam`) are linked to users via a nullable `userId` FK. This is **not** set automatically during sync — `ownerEspnMemberId` is stored on each team (raw from the ESPN API) but is not used for linking because it isn't reliable across seasons. Associations are managed manually via the admin panel.

```
User (1) ──── (many) EspnTeam
              └─ userId nullable — set via admin
              └─ ownerEspnMemberId stored but not used for linking
```

A user with no linked teams is valid (e.g. a new account before mapping is done). A team with no `userId` is also valid (unmapped team).

## Admin Panel

Routes: `/admin` (user list) and `/admin/users/:id` (user detail).

**`/admin`**
- Lists all users with name, email, admin flag, join date
- "Add User" form — creates a new account with: firstName, lastName, email, password, groupmeId, favoriteTeam, isAdmin

**`/admin/users/:id`**
- Edit all user profile fields (including groupmeId, favoriteTeam, isAdmin)
- View currently linked ESPN teams (shown as a table, removable)
- Link additional ESPN teams via a search filter (by name, abbreviation, or year)
- Shows a warning if a team is already linked to a different user; allows reassignment

**Admin API endpoints:**
```
GET    /api/admin/                    → list all users
POST   /api/admin/users               → create user
GET    /api/admin/users/:id           → user detail + linked ESPN teams
PUT    /api/admin/users/:id           → update user profile
GET    /api/admin/espn-teams          → all ESPN teams (with current owner info)
PATCH  /api/admin/espn-teams/:teamId  → set or clear userId on a team
```

All admin endpoints use the `checkAdmin` helper (defined in `server/routes/admin.ts`) which validates the session and checks `isAdmin: true`.

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
- Icons use `@phosphor-icons/react` — prefer `weight="duotone"` for hero/positive icons, `weight="bold"` for negative/neutral icons

## Mobile-First Design (non-admin pages)

All user-facing pages are designed mobile-first. **New features must follow this approach.**

### Breakpoints
- `≤ 640px` — mobile (primary breakpoint in `App.css`)
- `≤ 768px` — tablet (used for `.two-col` grid)

### Navigation
On mobile (≤ 640px), the top nav collapses to a hamburger button (`☰`) that opens a full-screen overlay with all nav links and the sign-out option. Implemented in `src/components/Layout.tsx` with `menuOpen` state.

### Tables → Card Reflow
Tables (`data-table`) automatically reflow into stacked cards on mobile using CSS `::before` pseudo-elements. Every `<td>` in a user-facing table **must** have a `data-label` attribute matching its column header:

```tsx
<td data-label="Team">...</td>
<td data-label="W">{team.wins}</td>
```

The CSS reads `content: attr(data-label)` to render the label on the left, with the value on the right. This is handled globally in `App.css` — no per-component changes needed beyond adding `data-label`.

**Exception:** Admin pages (`/admin`, `/admin/users/:id`) are desktop-only and do not require `data-label` or mobile handling.

### Other Mobile Rules
- Use `auto-fill` grids with `minmax()` so cards adapt to any screen width
- `.week-tabs` and `.hof-tab-row` use horizontal scroll (`overflow-x: auto`) on mobile — do not add `flex-wrap` back
- Touch targets: form buttons and primary actions should have adequate tap area (the CSS handles `min-height: 44px` for `button`/`.btn` globally on mobile)
- Avoid fixed widths; prefer `max-width` with `width: 100%`

## Key CSS Classes (for consistent UI)

| Class | Use |
|---|---|
| `page` | Top-level page wrapper |
| `page-header` | Title/meta section at top of page |
| `section` | Content section with margin |
| `card` / `card table-card` | Bordered card, use `table-card` when it directly wraps a table |
| `data-table` | Standard `<table>` styling — reflows to cards on mobile via `data-label` |
| `team-link` | Inline logo + name link (used in tables) |
| `team-link-plain` | Plain text link, no logo treatment |
| `hof-manager` | Small subdued manager name shown below a team name in a table |
| `champion-row` | Gold highlight row for the champion |
| `last-place-row` | Subdued highlight for last place |
| `muted` | Greyed-out text |
| `loading-screen` | Full-page loading state |
| `empty-state` | Centered empty/error state |
| `breadcrumb` / `breadcrumb-sep` | Breadcrumb navigation |
| `team-name-row` | `inline-flex` wrapper for a `team-link` + badge icon in a table cell — ensures proper vertical alignment |
| `champion-badge` | Gold icon badge next to the champion team name |
| `last-place-badge` | Muted icon badge next to the last-place team name |
