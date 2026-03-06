# BBR Nation — Project Vision

BBR Nation is a private web app for the members of our ESPN fantasy football league. Every user on the site is a league member — no more, no less. The app lives behind an auth wall and serves as the central hub for league communication, banter, and real-time fantasy data.

## Core Features

### 1. Group Chat & DMs
A main group chat channel for the whole league, plus the ability to send direct messages between members. Built on WebSockets for real-time delivery.

→ [Plan](./plans/01-chat.md)

### 2. External Bot Integration
Integration point for an external bot service designed for live chat interactions. The bot API details are TBD — the architecture should carve out clean boundaries for external API calls that inject messages into the chat system.

→ [Plan](./plans/02-bot-integration.md)

### 3. Fantasy Football Homepage
A homepage that renders content driven by the current ESPN fantasy football season. Uses the [ESPN Fantasy Football API](https://github.com/mkreiser/ESPN-Fantasy-Football-API) Node package to pull league data, standings, matchups, and more.

→ [Plan](./plans/03-fantasy-homepage.md)

### 4. User Model & League Membership
Each user maps 1:1 to a fantasy league member. User records include:
- `email` / `password` (auth — already scaffolded)
- `firstName` / `lastName`
- `espnId` — their ESPN member ID for linking fantasy data
- `groupmeId` — their GroupMe ID for bot/messaging integration
- `favoriteTeam` — their favorite NFL team

→ [Plan](./plans/04-user-model.md)

### 5. Deployment on Fly.io
Automated deployments via a personal Fly.io account. The Dockerfile and Postgres setup are already in place — this plan covers CI/CD, secrets management, and production configuration.

→ [Plan](./plans/05-deployment.md)

## Current Stack

| Layer      | Tech                          |
|------------|-------------------------------|
| Frontend   | React 19 + Vite + TypeScript  |
| Backend    | Fastify + TypeScript          |
| Database   | PostgreSQL + Prisma ORM       |
| Realtime   | Fastify WebSocket             |
| Auth       | Session-based (cookie + bcrypt) |
| Infra      | Docker, Fly.io                |
