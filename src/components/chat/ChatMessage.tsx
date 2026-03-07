import { useAuth } from "../../context/AuthContext";
import type { ChatMessageData } from "../../context/ChatContext";

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

export function ChatMessage({ message }: { message: ChatMessageData }) {
  const { user } = useAuth();
  const isOwn = user?.id === message.user.id;

  return (
    <div className={`chat-message ${isOwn ? "chat-message-own" : ""}`}>
      {!isOwn && (
        <span className="chat-message-sender">
          {message.user.firstName} {message.user.lastName}
        </span>
      )}
      <div className="chat-message-bubble">
        <span className="chat-message-content">{message.content}</span>
      </div>
      <span className="chat-message-time">{formatTime(message.createdAt)}</span>
    </div>
  );
}
