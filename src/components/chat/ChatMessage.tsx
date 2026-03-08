import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import type { ChatMessageData } from "../../context/ChatContext";

const REACTION_EMOJIS = ["😂", "💯", "🧠", "👀", "😭", "❤️"];

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
  const { toggleReaction } = useChat();
  const isOwn = user?.id === message.user.id;
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close picker when clicking outside
  useEffect(() => {
    if (!showPicker) return;
    function handlePointerDown(e: PointerEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [showPicker]);

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    setShowPicker((v) => !v);
  }

  function handleTouchStart() {
    longPressTimer.current = setTimeout(() => {
      setShowPicker(true);
    }, 500);
  }

  function handleTouchEnd() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  function handlePickEmoji(emoji: string) {
    toggleReaction(message.id, emoji);
    setShowPicker(false);
  }

  return (
    <div className={`chat-message ${isOwn ? "chat-message-own" : ""}`}>
      {!isOwn && (
        <span className="chat-message-sender">
          {message.user.firstName} {message.user.lastName}
        </span>
      )}
      {showPicker && (
        <div ref={pickerRef} className="chat-emoji-picker">
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="chat-emoji-btn"
              onClick={() => handlePickEmoji(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
      <div
        className="chat-message-bubble"
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <span className="chat-message-content">{message.content}</span>
      </div>
      {message.reactions.length > 0 && (
        <div className="chat-reactions">
          {message.reactions.map(({ emoji, count, userIds }) => (
            <button
              key={emoji}
              type="button"
              className={`chat-reaction${user && userIds.includes(user.id) ? " chat-reaction-mine" : ""}`}
              onClick={() => toggleReaction(message.id, emoji)}
            >
              {emoji} <span>{count}</span>
            </button>
          ))}
        </div>
      )}
      <span className="chat-message-time">{formatTime(message.createdAt)}</span>
    </div>
  );
}
