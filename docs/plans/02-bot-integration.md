# Plan: External Bot Integration

**Status:** Ready to implement

## Overview

Users trigger the bot by prefixing a chat message with `@bbot`. BBR Nation's server strips the prefix, forwards the text to the external bot API, and injects the response back into the group chat as a message from a dedicated "BBRBot" user. The integration is outbound-only (BBR Nation calls the bot; the bot never pushes to us).

## External API

- **Endpoint:** `POST https://bbr-chat-service.fly.dev/chat/api/query/`
- **Auth:** `Authorization: Bearer <secret>` (stored as env var `BOT_API_SECRET`)
- **Request:** `{ text: string, groupme_id?: string }`
- **Response:** `{ groupme_id: string, response: string }` — synchronous, not streamed
- **Stateless:** no conversation history maintained server-side

## Key Decisions

| Decision | Choice |
|---|---|
| Trigger | `@bbot` prefix in group chat input |
| Direction | Outbound only — BBR Nation calls the bot |
| Bot identity | Dedicated `BBRBot` system user in the DB |
| Bot message style | Blends in as a regular chat message (same UI, different sender name) |
| `groupme_id` usage | Pass the triggering user's BBR `userId` for correlation/logging |
| Rate limiting | 1 bot request per user per 15 seconds (server-enforced) |
| Error handling | Post a visible bot error message into chat (no silent failures) |

## Data Model Changes

Add a `isBot` flag to `ChatMessage` and a `isSystemUser` flag to `User`. This avoids making `userId` nullable and keeps the existing broadcast shape intact.

```prisma
// prisma/schema.prisma

model User {
  // ...existing fields...
  isSystemUser Boolean @default(false) @map("is_system_user")
}

model ChatMessage {
  // ...existing fields...
  isBot Boolean @default(false) @map("is_bot")
}
```

The `BBRBot` user is seeded once (via a Prisma seed script or a startup check). It will never have a session or password — just a stable record to attach bot messages to.

## Server Architecture

### New files
- `server/services/bot.ts` — wraps the external API call, owns rate-limit state
- `server/routes/bot.ts` — Fastify route that receives the trigger and drives the flow

### Flow

```
User sends "@bbot <question>" via WebSocket
  → server/ws/channels.ts detects @bbot prefix
  → strips prefix, calls botService.query(userId, text)
    → rate-limit check (reject if too soon)
    → POST to external API with { text, groupme_id: userId }
    → on success: insert ChatMessage (isBot: true, userId: BBRBot.id)
    → broadcastAll() the bot message to all WS clients
    → on error: insert + broadcast a friendly error message
  → original user message is also saved + broadcast as normal
```

The `@bbot` detection lives in the existing WebSocket message handler in `channels.ts` — the message is saved and broadcast as normal first, then the bot call fires async so the user's message appears immediately.

### `server/services/bot.ts`

```typescript
export class BotService {
  private rateLimitMap = new Map<string, number>(); // userId → lastCallMs
  private readonly RATE_LIMIT_MS = 15_000;

  async query(userId: string, text: string): Promise<string>
  private isRateLimited(userId: string): boolean
}
```

### Env vars

```
BOT_API_SECRET=<bearer token from admin>
BOT_USER_EMAIL=bbrbot@bbrnation.internal  # used to find/seed the bot user
```

## Frontend Changes

Minimal — since bot messages blend in visually:

1. **Chat input** — no special handling needed; `@bbot ...` is sent as a normal message
2. **Typing indicator** — optionally show "BBRBot is thinking..." in the message list while the API call is in flight. This requires a new WS message type: `{ type: "bot_thinking", channel: string }` broadcast to all clients when a bot call starts, and cleared when the response arrives.
3. **`isBot` on message objects** — pass through from server so the frontend has it available for future styling if needed

## Implementation Steps

- [ ] Prisma: add `isBot` to `ChatMessage`, `isSystemUser` to `User`; run migration
- [ ] Seed: ensure `BBRBot` system user exists on server startup (idempotent upsert)
- [ ] `server/services/bot.ts`: implement `BotService` with rate limiting and external API call
- [ ] `server/ws/channels.ts`: detect `@bbot` prefix in incoming WS messages; wire up `BotService`; add optional `bot_thinking` broadcast
- [ ] `server/routes/chat.ts`: include `isBot` in message select/response shape
- [ ] Frontend `ChatContext`: pass `isBot` through on message objects
- [ ] Frontend `ChatMessage`: no visual change needed, but accept `isBot` prop for future use
- [ ] Env: document `BOT_API_SECRET` and `BOT_USER_EMAIL` in `.env.example`
- [ ] Test end-to-end: `@bbot hello` → bot response appears in chat

## Out of Scope (v1)

- Inbound webhook (bot pushing to us unsolicited)
- Per-channel bot config
- Bot command registry (`@bbot !standings`, etc.)
- Conversation history / multi-turn context
- Admin UI for bot settings
