import { FastifyPluginAsync } from "fastify";
import { WebSocket } from "ws";

interface Client {
  ws: WebSocket;
  userId: string | null;
  channels: Set<string>;
}

type IncomingMessage =
  | { type: "join"; channel: string }
  | { type: "leave"; channel: string }
  | { type: "message"; channel: string; data: unknown };

type OutgoingMessage =
  | { type: "joined"; channel: string; members: number }
  | { type: "left"; channel: string }
  | { type: "message"; channel: string; from: string | null; data: unknown }
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
    const userId = request.session.get("userId") ?? null;

    const client: Client = {
      ws: socket,
      userId,
      channels: new Set(),
    };

    socket.on("message", (raw) => {
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
          if (typeof msg.channel === "string" && client.channels.has(msg.channel)) {
            channels.broadcast(msg.channel, {
              type: "message",
              channel: msg.channel,
              from: client.userId,
              data: msg.data,
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
