import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";

export interface ChatMessageData {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string };
}

interface ChatContextValue {
  isOpen: boolean;
  toggleChat: () => void;
  messages: ChatMessageData[];
  sendMessage: (text: string) => void;
  loading: boolean;
  loadMore: () => void;
  hasMore: boolean;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const joinedRef = useRef(false);

  // Fetch message history
  const fetchHistory = useCallback(async (before?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (before) params.set("before", before);
      params.set("limit", "50");

      const res = await fetch(`/api/chat/messages?${params}`);
      if (!res.ok) return;

      const data = await res.json();
      const fetched: ChatMessageData[] = data.messages;

      if (fetched.length < 50) setHasMore(false);

      if (before) {
        // Prepend older messages
        setMessages((prev) => [...fetched, ...prev]);
      } else {
        setMessages(fetched);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (loading || !hasMore || messages.length === 0) return;
    fetchHistory(messages[0].createdAt);
  }, [loading, hasMore, messages, fetchHistory]);

  // WebSocket connection
  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "join", channel: "main" }));
      joinedRef.current = true;
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "message" && msg.channel === "main") {
          const chatMsg: ChatMessageData = {
            id: msg.id,
            content: msg.content,
            createdAt: msg.createdAt,
            user: msg.user,
          };
          setMessages((prev) => [...prev, chatMsg]);
        }
      } catch {
        // ignore non-JSON
      }
    };

    ws.onclose = () => {
      joinedRef.current = false;
    };

    // Load initial history
    fetchHistory();

    return () => {
      joinedRef.current = false;
      ws.close();
      wsRef.current = null;
    };
  }, [user, fetchHistory]);

  const sendMessage = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)
      return;

    wsRef.current.send(
      JSON.stringify({ type: "message", channel: "main", data: trimmed })
    );
  }, []);

  const toggleChat = useCallback(() => setIsOpen((v) => !v), []);

  return (
    <ChatContext.Provider
      value={{ isOpen, toggleChat, messages, sendMessage, loading, loadMore, hasMore }}
    >
      {children}
    </ChatContext.Provider>
  );
}
