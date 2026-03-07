import { useState, useRef, useEffect, type FormEvent } from "react";
import { useChat } from "../../context/ChatContext";
import { ChatMessage } from "./ChatMessage";

export function ChatPanel() {
  const { isOpen, toggleChat, messages, sendMessage, loading, loadMore, hasMore } =
    useChat();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(0);

  // Auto-scroll to bottom on new messages (but not when loading older ones)
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      const isNewMessage =
        prevMessageCountRef.current > 0 &&
        messages.length - prevMessageCountRef.current <= 2;
      const isInitialLoad = prevMessageCountRef.current === 0;

      if (isNewMessage || isInitialLoad) {
        messagesEndRef.current?.scrollIntoView({ behavior: isInitialLoad ? "instant" : "smooth" });
      }
    }
    prevMessageCountRef.current = messages.length;
  }, [messages]);

  // Scroll to bottom when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
      }, 50);
    }
  }, [isOpen]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  }

  function handleScroll() {
    const container = messagesContainerRef.current;
    if (!container || loading || !hasMore) return;

    if (container.scrollTop < 50) {
      loadMore();
    }
  }

  if (!isOpen) return null;

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h3>League Chat</h3>
        <button className="chat-close" onClick={toggleChat} aria-label="Close chat">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div
        className="chat-messages"
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        {loading && <div className="chat-loading">Loading...</div>}
        {messages.length === 0 && !loading && (
          <div className="chat-empty">No messages yet. Say something!</div>
        )}
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          autoFocus
        />
        <button type="submit" disabled={!input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
