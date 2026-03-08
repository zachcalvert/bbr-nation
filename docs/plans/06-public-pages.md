# Plan: Make Home, Seasons, and Hall of Fame publicly viewable

## Summary

The backend APIs that power these pages are **already public** (no auth checks). The work is entirely on the frontend — restructuring the React Router tree so these routes don't require login.

## Key finding: `useAuth()` is safe with null user

HomePage and HallOfFamePage both call `useAuth()` but only use `user` with optional chaining (`user?.id === ...`) for "my team" highlighting. When `user` is null, the highlighting just doesn't appear — no crashes. SeasonsPage doesn't use `useAuth()` at all.

## Changes

### 1. Restructure route tree in `src/App.tsx`

Move the public pages **outside** `<RequireAuth />` but still **inside** `<Layout />` (so they get the nav bar). The auth-only pages (profile, edit profile) and admin pages stay inside `<RequireAuth />`.

**New structure:**
```
<Routes>
  <Route path="/login" element={<LoginPage />} />

  {/* Shared layout with nav (public + auth pages) */}
  <Route element={<ChatProvider><Layout /></ChatProvider>}>

    {/* Public pages */}
    <Route index element={<HomePage />} />
    <Route path="/seasons" element={<SeasonsPage />} />
    <Route path="/seasons/:year" element={<SeasonDetailPage />} />
    <Route path="/seasons/:year/teams/:teamId" element={<TeamDetailPage />} />
    <Route path="/hall-of-fame" element={<HallOfFamePage />} />

    {/* Auth-gated pages */}
    <Route element={<RequireAuth />}>
      <Route path="/members/:userId" element={<UserProfilePage />} />
      <Route path="/members/:userId/edit" element={<EditProfilePage />} />

      {/* Admin-only */}
      <Route element={<RequireAdmin />}>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/users/:userId" element={<AdminUserDetailPage />} />
      </Route>
    </Route>
  </Route>

  <Route path="*" element={<Navigate to="/" replace />} />
</Routes>
```

### 2. Conditionally show chat bubble in `src/components/Layout.tsx`

Only render `<ChatToggle />` and `<ChatPanel />` when `user` is not null. The `user` variable is already available in Layout from `useAuth()`.

```tsx
{user && <ChatToggle />}
{user && <ChatPanel />}
```

### 3. Show login link for unauthenticated users in `src/components/Layout.tsx`

Currently the nav-user area shows username + "Sign out" when logged in, and nothing when logged out. Add a "Sign in" link when `user` is null so visitors can log in.

```tsx
{user ? (
  // existing username + sign out
) : (
  <NavLink to="/login" className="btn-ghost">Sign in</NavLink>
)}
```

Same for the mobile menu — add a "Sign in" link in the bottom section.

## What stays the same

- **Backend** — No changes needed. All data APIs for these pages are already public.
- **Profile pages** (`/members/:userId`, `/members/:userId/edit`) — Stay behind `<RequireAuth />`
- **Admin pages** — Stay behind `<RequireAdmin />`
- **Links to `/members/:userId`** on public pages — Still render, but clicking them will redirect unauthenticated users to `/login` (handled by RequireAuth)
