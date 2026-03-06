# Plan: Fantasy Football Homepage

**Status:** Not started

## Overview
The homepage renders content based on the current ESPN fantasy football season for our league. Data is pulled via the [`espn-fantasy-football-api`](https://github.com/mkreiser/ESPN-Fantasy-Football-API) Node package.

## Key Decisions (TBD)
- What data to show: standings, matchups, scores, power rankings, records?
- Offseason vs. in-season — different homepage content?
- Caching strategy — how often to refresh ESPN data?
- ESPN API auth — private league requires `espn_s2` and `SWID` cookies. Where to store/manage these?
- Server-side data fetching (API routes) vs. client-side?

## Rough Scope
- [ ] Install and configure `espn-fantasy-football-api`
- [ ] Server-side routes to fetch and cache league data from ESPN
- [ ] Store ESPN auth cookies (`espn_s2`, `SWID`) securely
- [ ] Homepage UI — season-aware layout
- [ ] Standings component
- [ ] Weekly matchups component
- [ ] Team detail / roster view
- [ ] Offseason fallback content

## Existing Foundation
- Fastify server ready for new API routes
- React frontend with Vite

## Notes
- The `espn-fantasy-football-api` package supports league info, teams, matchups, and historical data.
- Each user's `espnId` field (see `04-user-model.md`) allows mapping league members to their fantasy teams.
