# Plan: External Bot Integration

**Status:** Not started — awaiting API details

## Overview
Integrate with an external bot service designed for live chat. The bot should be able to post messages into the group chat (and potentially respond to commands or triggers). The external API spec is TBD.

## Key Decisions (TBD)
- Inbound vs. outbound — does BBR Nation call the bot, or does the bot push to us, or both?
- Auth mechanism for the bot API (API key, OAuth, webhook secret?)
- Should bot messages look different in the UI vs. human messages?
- Rate limiting / abuse prevention

## Rough Scope
- [ ] Define internal interface for "external message sources"
- [ ] Server-side service layer for outbound API calls to the bot
- [ ] Webhook/endpoint for inbound messages from the bot
- [ ] Message type in the data model to distinguish bot vs. human messages
- [ ] UI treatment for bot messages in the chat

## Existing Foundation
- Fastify server is ready for new route registration
- WebSocket broadcast infrastructure exists

## Notes
- Keep this loosely coupled — the bot integration should be a plugin/service that hooks into the chat system, not deeply entangled with it.
- API details will be shared later; for now, the goal is clean architectural boundaries.
