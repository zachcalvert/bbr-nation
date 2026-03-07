# Plan: Group Chat & DMs

**Status:** v1 shipped (group chat) — DMs not yet started

## Overview
Build out the main group chat for all league members and support for direct messages between any two members.

## v1: Main Group Chat (shipped)

### Key Decisions
- **Persistence:** All messages stored in Postgres. History loads on connect.
- **History loading:** Cursor-based pagination, 50 messages at a time, scroll-to-top to load more.
- **DMs:** Deferred to v2. v1 is group chat only.
- **Extras:** Kept simple — no typing indicators, read receipts, presence, or unread badges.
- **Media:** Text-only for now.
- **Bot support:** The `ChatMessage` model stores a `userId` FK. Bot integration will need a way to author messages (either a system user or a nullable `userId` with a separate `botId` field — TBD in `02-bot-integration.md`).

### Data Model

**`ChatMessage`** (Prisma model → `chat_messages` table):
| Column      | Type     | Notes                        |
|-------------|----------|------------------------------|
| `id`        | cuid     | Primary key                  |
| `content`   | String   | Message text                 |
| `userId`    | String   | FK → `users.id`              |
| `createdAt` | DateTime | Indexed for pagination       |

Relation: `User.chatMessages` → `ChatMessage[]`

### Backend

**REST endpoint:**
- `GET /api/chat/messages` — paginated history
  - Query params: `before` (ISO cursor), `limit` (default 50, max 100)
  - Returns `{ messages: [{ id, content, createdAt, user: { id, firstName, lastName } }] }` in chronological order
  - Auth-gated via session

**WebSocket handler** (`server/ws/channels.ts`):
- On incoming `message` to the `"main"` channel:
  1. Validates non-empty content and authenticated user
  2. Persists to `chat_messages` via Prisma
  3. Broadcasts enriched payload (`id`, `content`, `createdAt`, `user`) to **all** channel members (including sender)
- Outgoing message type updated to include full user object instead of raw `from` userId

### Frontend

**ChatContext** (`src/context/ChatContext.tsx`):
- Global provider wrapping all auth-gated routes (inside `RequireAuth`, outside `Layout`)
- On mount: fetches message history via REST, opens WebSocket, joins `"main"` channel
- Manages: `isOpen`, `messages[]`, `loading`, `hasMore`
- Exposes: `toggleChat()`, `sendMessage(text)`, `loadMore()`

**Components** (`src/components/chat/`):
- `ChatToggle` — fixed bottom-right FAB with chat bubble icon. Hides when panel is open.
- `ChatPanel` — the overlay. Header with title + close, scrollable message list, text input + send.
  - Desktop: 380x500px fixed panel, bottom-right, with slide-up animation
  - Mobile (<768px): full-screen overlay
  - Auto-scrolls to bottom on new messages and initial load
  - Scroll-to-top triggers `loadMore()` for older messages
- `ChatMessage` — single message bubble. Own messages right-aligned with accent color, others left-aligned with sender name. Relative timestamps.

**Wiring:**
- `ChatProvider` wraps the `<Layout />` route element in `App.tsx`
- `ChatToggle` + `ChatPanel` rendered at the end of `Layout.tsx`, outside `<main>` (fixed position, doesn't affect page flow)

### Files

| File | Role |
|------|------|
| `prisma/schema.prisma` | `ChatMessage` model + `User` relation |
| `server/routes/chat.ts` | `GET /api/chat/messages` |
| `server/ws/channels.ts` | Persist + broadcast enriched messages |
| `src/context/ChatContext.tsx` | Global chat state + WS connection |
| `src/components/chat/ChatToggle.tsx` | Floating chat button |
| `src/components/chat/ChatPanel.tsx` | Chat overlay panel |
| `src/components/chat/ChatMessage.tsx` | Single message display |
| `src/App.tsx` | ChatProvider wiring |
| `src/components/Layout.tsx` | Renders toggle + panel |
| `src/App.css` | All chat styles |

---

## v2: Future Work

- [ ] **DMs** — 1:1 direct messages between members. Needs a `Channel` or `Conversation` abstraction.
- [ ] **Unread badges** — count on the minimized chat toggle
- [ ] **Online presence** — show who's currently connected
- [ ] **Typing indicators**
- [ ] **Link previews / media**
- [ ] **Bot message support** — accommodate bot-authored messages in the data model (see `02-bot-integration.md`)
