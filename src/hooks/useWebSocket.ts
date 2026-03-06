import { useEffect, useRef, useState, useCallback } from "react";

type WSMessage = {
  type: string;
  channel?: string;
  [key: string]: unknown;
};

export function useWebSocket(url: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<WSMessage[]>([]);

  useEffect(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        setMessages((prev) => [...prev, msg]);
      } catch {
        // ignore non-JSON messages
      }
    };

    return () => {
      ws.close();
    };
  }, [url]);

  const send = useCallback((message: WSMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const joinChannel = useCallback(
    (channel: string) => send({ type: "join", channel }),
    [send]
  );

  const leaveChannel = useCallback(
    (channel: string) => send({ type: "leave", channel }),
    [send]
  );

  const sendMessage = useCallback(
    (channel: string, data: unknown) =>
      send({ type: "message", channel, data }),
    [send]
  );

  return { connected, messages, joinChannel, leaveChannel, sendMessage, send };
}
