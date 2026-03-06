# Plan: Deployment on Fly.io

**Status:** Not started

## Overview
Automate deployments to a personal Fly.io account. The Dockerfile and Postgres setup are already scaffolded — this plan covers getting to a working production deployment with CI/CD.

## Key Decisions (TBD)
- CI/CD platform — GitHub Actions, or just `fly deploy` manually to start?
- Fly Postgres (managed) vs. external Postgres provider?
- Custom domain?
- Staging environment or just production?

## Rough Scope
- [ ] `fly.toml` configuration
- [ ] Provision Fly Postgres database
- [ ] Set secrets on Fly (`DATABASE_URL`, `SESSION_SECRET`, ESPN cookies, etc.)
- [ ] Verify Dockerfile works for Fly deployment
- [ ] Run Prisma migrations on deploy
- [ ] GitHub Actions workflow for auto-deploy on push to `main`
- [ ] Health check endpoint
- [ ] Custom domain + TLS (if desired)

## Existing Foundation
- `Dockerfile` builds the app (Node 22, Prisma generate, Vite build)
- `docker-compose.yml` handles local dev with Postgres
- App listens on port 3001

## Notes
- Fly.io expects the app to bind to `0.0.0.0` — already configured in `server/index.ts`.
- The `PORT` env var is respected — Fly sets this automatically.
- Prisma migrations need to run as part of the deploy process (release command or entrypoint script).
