# Plan: Group Chat & DMs

**Status:** Not started

## Overview
Build out the main group chat for all league members and support for direct messages between any two members.

## Key Decisions (TBD)
- Message persistence — store in Postgres or keep ephemeral?
- Message history — how far back to load on connect?
- DM data model — separate table vs. a `channel` abstraction that covers both group and DM?
- Typing indicators, read receipts, or keep it simple?
- Media/link previews or text-only?

## Rough Scope
- [ ] Data model for messages and conversations/channels
- [ ] Server-side WebSocket handlers for group chat
- [ ] Server-side WebSocket handlers for DMs
- [ ] Chat UI — message list, input, channel/DM switcher
- [ ] Unread indicators
- [ ] Message persistence and history loading
- [ ] Online presence indicators

## Existing Foundation
- WebSocket infrastructure is scaffolded (`server/ws/channels.ts`, `src/hooks/useWebSocket.ts`)
- Basic channel join/leave/send flow already works
- Auth + sessions in place

## Notes
- The external bot integration (see `02-bot-integration.md`) will inject messages into this same chat system, so the data model needs to accommodate bot-authored messages.
