import { FastifyPluginAsync } from "fastify";
import { WebSocket } from "ws";
import { prisma } from "../index.js";

interface Client {
  ws: WebSocket;
  userId: string | null;
  channels: Set<string>;
}

export type ReactionSummary = {
  emoji: string;
  count: number;
  userIds: string[];
};

export function summarizeReactions(
  reactions: Array<{ emoji: string; userId: string }>
): ReactionSummary[] {
  const map = new Map<string, string[]>();
  for (const r of reactions) {
    if (!map.has(r.emoji)) map.set(r.emoji, []);
    map.get(r.emoji)!.push(r.userId);
  }
  return Array.from(map.entries()).map(([emoji, userIds]) => ({
    emoji,
    count: userIds.length,
    userIds,
  }));
}

const ALLOWED_EMOJIS = ["😂", "💯", "🧠", "👀", "😭", "❤️"];

type IncomingMessage =
  | { type: "join"; channel: string }
  | { type: "leave"; channel: string }
  | { type: "message"; channel: string; data: unknown }
  | { type: "react"; channel: string; messageId: string; emoji: string };

type OutgoingMessage =
  | { type: "joined"; channel: string; members: number }
  | { type: "left"; channel: string }
  | {
      type: "message";
      channel: string;
      id: string;
      content: string;
      createdAt: string;
      user: { id: string; firstName: string; lastName: string };
    }
  | {
      type: "reaction";
      channel: string;
      messageId: string;
      reactions: ReactionSummary[];
    }
  | { type: "member_joined"; channel: string; userId: string | null }
  | { type: "member_left"; channel: string; userId: string | null }
  | { type: "error"; message: string };

class ChannelManager {
  private channels = new Map<string, Set<Client>>();

  join(client: Client, channel: string) {
    client.channels.add(channel);

    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
    }
    this.channels.get(channel)!.add(client);

    // Notify others in the channel
    this.broadcast(
      channel,
      { type: "member_joined", channel, userId: client.userId },
      client
    );

    // Confirm join to the client
    this.send(client, {
      type: "joined",
      channel,
      members: this.channels.get(channel)!.size,
    });
  }

  leave(client: Client, channel: string) {
    client.channels.delete(channel);

    const members = this.channels.get(channel);
    if (!members) return;

    members.delete(client);
    if (members.size === 0) {
      this.channels.delete(channel);
    } else {
      this.broadcast(channel, {
        type: "member_left",
        channel,
        userId: client.userId,
      });
    }

    this.send(client, { type: "left", channel });
  }

  leaveAll(client: Client) {
    for (const channel of client.channels) {
      this.leave(client, channel);
    }
  }

  broadcastAll(channel: string, message: OutgoingMessage) {
    this.broadcast(channel, message);
  }

  broadcast(
    channel: string,
    message: OutgoingMessage,
    exclude?: Client
  ) {
    const members = this.channels.get(channel);
    if (!members) return;

    const data = JSON.stringify(message);
    for (const member of members) {
      if (member !== exclude && member.ws.readyState === WebSocket.OPEN) {
        member.ws.send(data);
      }
    }
  }

  private send(client: Client, message: OutgoingMessage) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }
}

const channels = new ChannelManager();

export const wsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", { websocket: true }, (socket, request) => {
    const userId = request.session.userId ?? null;

    const client: Client = {
      ws: socket,
      userId,
      channels: new Set(),
    };

    socket.on("message", async (raw) => {
      let msg: IncomingMessage;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        socket.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
        return;
      }

      switch (msg.type) {
        case "join":
          if (typeof msg.channel === "string" && msg.channel.length > 0) {
            channels.join(client, msg.channel);
          }
          break;

        case "leave":
          if (typeof msg.channel === "string") {
            channels.leave(client, msg.channel);
          }
          break;

        case "message":
          if (
            typeof msg.channel === "string" &&
            client.channels.has(msg.channel) &&
            client.userId
          ) {
            const content =
              typeof msg.data === "string"
                ? msg.data
                : typeof (msg.data as any)?.text === "string"
                  ? (msg.data as any).text
                  : String(msg.data);

            if (!content.trim()) break;

            // Persist to database
            const saved = await prisma.chatMessage.create({
              data: {
                content: content.trim(),
                userId: client.userId,
              },
              select: {
                id: true,
                content: true,
                createdAt: true,
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            });

            // Broadcast to ALL members (including sender)
            channels.broadcastAll(msg.channel, {
              type: "message",
              channel: msg.channel,
              id: saved.id,
              content: saved.content,
              createdAt: saved.createdAt.toISOString(),
              user: saved.user,
            });
          }
          break;

        case "react":
          if (
            typeof msg.channel === "string" &&
            client.channels.has(msg.channel) &&
            client.userId &&
            typeof msg.messageId === "string" &&
            ALLOWED_EMOJIS.includes(msg.emoji)
          ) {
            const chatMessage = await prisma.chatMessage.findUnique({
              where: { id: msg.messageId },
            });
            if (!chatMessage) break;

            const existing = await prisma.chatReaction.findUnique({
              where: {
                messageId_userId_emoji: {
                  messageId: msg.messageId,
                  userId: client.userId,
                  emoji: msg.emoji,
                },
              },
            });

            if (existing) {
              await prisma.chatReaction.delete({ where: { id: existing.id } });
            } else {
              await prisma.chatReaction.create({
                data: {
                  messageId: msg.messageId,
                  userId: client.userId,
                  emoji: msg.emoji,
                },
              });
            }

            const rawReactions = await prisma.chatReaction.findMany({
              where: { messageId: msg.messageId },
              select: { emoji: true, userId: true },
            });

            channels.broadcastAll(msg.channel, {
              type: "reaction",
              channel: msg.channel,
              messageId: msg.messageId,
              reactions: summarizeReactions(rawReactions),
            });
          }
          break;

        default:
          socket.send(
            JSON.stringify({ type: "error", message: `Unknown type: ${(msg as any).type}` })
          );
      }
    });

    socket.on("close", () => {
      channels.leaveAll(client);
    });
  });
};
