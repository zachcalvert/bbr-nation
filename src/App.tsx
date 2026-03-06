import { useState, FormEvent } from "react";
import { useWebSocket } from "./hooks/useWebSocket";

function App() {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [error, setError] = useState("");

  // Auth form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Channel state
  const [channelName, setChannelName] = useState("general");
  const [joinedChannel, setJoinedChannel] = useState("");
  const [chatInput, setChatInput] = useState("");

  const wsUrl = `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/ws`;
  const { connected, messages, joinChannel, leaveChannel, sendMessage } =
    useWebSocket(wsUrl);

  async function handleAuth(action: "register" | "login", e: FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch(`/api/auth/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const body = await res.json();
      setError(body.error || "Request failed");
      return;
    }
    const data = await res.json();
    setUser(data);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    if (joinedChannel) {
      leaveChannel(joinedChannel);
      setJoinedChannel("");
    }
  }

  function handleJoin(e: FormEvent) {
    e.preventDefault();
    if (joinedChannel) leaveChannel(joinedChannel);
    joinChannel(channelName);
    setJoinedChannel(channelName);
  }

  function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!chatInput.trim() || !joinedChannel) return;
    sendMessage(joinedChannel, { text: chatInput });
    setChatInput("");
  }

  return (
    <div className="app">
      <h1>Welcome</h1>

      {!user ? (
        <div className="card">
          <h2>Sign in</h2>
          {error && <p className="error">{error}</p>}
          <form onSubmit={(e) => handleAuth("login", e)}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="row">
              <button type="submit">Login</button>
              <button type="button" onClick={(e) => handleAuth("register", e)}>
                Register
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="card">
          <div className="user-info">
            <span>{user.email}</span>
            <button onClick={handleLogout}>Logout</button>
          </div>
        </div>
      )}

      <div className="card">
        <h2>Channels</h2>
        <p className="status">
          <span className={`dot ${connected ? "on" : "off"}`} />
          {connected ? "Connected" : "Disconnected"}
        </p>

        <form onSubmit={handleJoin}>
          <div className="row">
            <input
              placeholder="Channel name"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
            />
            <button type="submit" disabled={!connected}>
              Join
            </button>
          </div>
        </form>

        {joinedChannel && (
          <>
            <form onSubmit={handleSend} style={{ marginTop: "0.5rem" }}>
              <div className="row">
                <input
                  placeholder={`Message #${joinedChannel}`}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                />
                <button type="submit">Send</button>
              </div>
            </form>

            <div className="messages">
              {messages.map((msg, i) => (
                <p key={i}>
                  <strong>{msg.type}</strong>
                  {msg.type === "message" && msg.data
                    ? `: ${(msg.data as any).text}`
                    : ""}
                  {msg.channel ? ` [#${msg.channel}]` : ""}
                </p>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
