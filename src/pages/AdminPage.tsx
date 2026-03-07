import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

interface SyncStatus {
  running: boolean;
  lastStartedAt: string | null;
  lastCompletedAt: string | null;
  lastError: string | null;
}

function SyncPanel() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [triggering, setTriggering] = useState(false);
  const wasRunning = useRef(false);

  function fetchStatus() {
    return fetch("/api/espn/status")
      .then((r) => r.json())
      .then((d) => setStatus(d.sync));
  }

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    if (!status) return;
    if (status.running) {
      wasRunning.current = true;
      const id = setInterval(fetchStatus, 2000);
      return () => clearInterval(id);
    } else if (wasRunning.current) {
      wasRunning.current = false;
    }
  }, [status?.running]);

  async function handleBackfill() {
    setTriggering(true);
    await fetch("/api/espn/sync/backfill", { method: "POST" });
    setTriggering(false);
    setTimeout(fetchStatus, 500);
  }

  const running = status?.running ?? false;
  const lastCompleted = status?.lastCompletedAt
    ? new Date(status.lastCompletedAt).toLocaleString()
    : null;

  return (
    <div className="sync-panel">
      <div className="sync-info">
        {running ? (
          <span className="sync-status syncing">
            <span className="sync-dot" /> Syncing…
          </span>
        ) : status?.lastError ? (
          <span className="sync-status error">Error: {status.lastError}</span>
        ) : lastCompleted ? (
          <span className="sync-status idle">Last synced {lastCompleted}</span>
        ) : (
          <span className="sync-status idle">Never synced</span>
        )}
      </div>
      <button
        className="btn-sync"
        onClick={handleBackfill}
        disabled={running || triggering}
      >
        {running ? "Syncing…" : "Backfill all seasons"}
      </button>
    </div>
  );
}

interface CarouselSlide {
  id: number;
  imageUrl: string;
  caption: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  createdAt: string;
}

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  groupmeId: "",
  favoriteTeam: "",
  isAdmin: false,
};

export function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [slidesLoading, setSlidesLoading] = useState(true);
  const [showSlideForm, setShowSlideForm] = useState(false);
  const [slideForm, setSlideForm] = useState({ imageUrl: "", caption: "", sortOrder: 0 });
  const [slideFormError, setSlideFormError] = useState("");
  const [slideSubmitting, setSlideSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/admin")
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load admin data: ${res.status}`);
        return res.json();
      })
      .then((data) => setUsers(data.users))
      .catch((err: Error) => setError(err.message || "Failed to load admin data"))
      .finally(() => setLoading(false));

    fetch("/api/admin/carousel")
      .then((res) => res.json())
      .then((data) => setSlides(data.slides))
      .catch(() => {})
      .finally(() => setSlidesLoading(false));
  }, []);

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to create user");
        return;
      }

      setUsers((prev) => [...prev, data.user]);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch {
      setFormError("Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateSlide(e: React.FormEvent) {
    e.preventDefault();
    setSlideFormError("");
    setSlideSubmitting(true);
    try {
      const res = await fetch("/api/admin/carousel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slideForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setSlideFormError(data.error || "Failed to create slide");
        return;
      }
      setSlides((prev) => [...prev, data.slide].sort((a, b) => a.sortOrder - b.sortOrder));
      setSlideForm({ imageUrl: "", caption: "", sortOrder: 0 });
      setShowSlideForm(false);
    } catch {
      setSlideFormError("Network error — please try again");
    } finally {
      setSlideSubmitting(false);
    }
  }

  async function handleToggleActive(id: number, currentValue: boolean) {
    try {
      const res = await fetch(`/api/admin/carousel/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentValue }),
      });
      if (res.ok) {
        setSlides((prev) => prev.map((s) => (s.id === id ? { ...s, isActive: !currentValue } : s)));
      }
    } catch {}
  }

  async function handleDeleteSlide(id: number) {
    try {
      const res = await fetch(`/api/admin/carousel/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSlides((prev) => prev.filter((s) => s.id !== id));
      }
    } catch {}
  }

  if (loading) return <div className="loading-screen">Loading…</div>;

  if (error) {
    return (
      <div className="page">
        <div className="empty-state">
          <p className="empty-title">Error</p>
          <p className="empty-sub">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Admin</h1>
      </div>

      <SyncPanel />

      <section className="section">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
          <h2 style={{ margin: 0 }}>Users</h2>
          <button
            className="btn-secondary"
            onClick={() => { setShowForm((v) => !v); setFormError(""); }}
          >
            {showForm ? "Cancel" : "Add User"}
          </button>
        </div>

        {showForm && (
          <div className="card" style={{ marginBottom: "1rem", padding: "1.25rem" }}>
            <h3 style={{ marginTop: 0 }}>New User</h3>
            {formError && <p className="muted" style={{ color: "var(--color-danger, #c0392b)" }}>{formError}</p>}
            <form onSubmit={handleCreateUser} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <label>
                First name
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  required
                />
              </label>
              <label>
                Last name
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  required
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  required
                />
              </label>
              <label>
                GroupMe ID
                <input
                  type="text"
                  value={form.groupmeId}
                  onChange={(e) => setForm((f) => ({ ...f, groupmeId: e.target.value }))}
                  required
                />
              </label>
              <label>
                Favorite team
                <input
                  type="text"
                  value={form.favoriteTeam}
                  onChange={(e) => setForm((f) => ({ ...f, favoriteTeam: e.target.value }))}
                  required
                />
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", gridColumn: "span 2" }}>
                <input
                  type="checkbox"
                  checked={form.isAdmin}
                  onChange={(e) => setForm((f) => ({ ...f, isAdmin: e.target.checked }))}
                />
                Admin
              </label>
              <div style={{ gridColumn: "span 2", display: "flex", justifyContent: "flex-end" }}>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? "Creating…" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="card table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Admin</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <Link to={`/admin/users/${u.id}`}>
                      {u.firstName} {u.lastName}
                    </Link>
                  </td>
                  <td>{u.email}</td>
                  <td>{u.isAdmin ? "✓" : ""}</td>
                  <td className="muted">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
          <h2 style={{ margin: 0 }}>Carousel</h2>
          <button
            className="btn-secondary"
            onClick={() => { setShowSlideForm((v) => !v); setSlideFormError(""); }}
          >
            {showSlideForm ? "Cancel" : "Add Slide"}
          </button>
        </div>

        {showSlideForm && (
          <div className="card" style={{ marginBottom: "1rem", padding: "1.25rem" }}>
            <h3 style={{ marginTop: 0 }}>New Slide</h3>
            {slideFormError && <p className="muted" style={{ color: "var(--color-danger, #c0392b)" }}>{slideFormError}</p>}
            <form onSubmit={handleCreateSlide}>
              <label>
                Image URL
                <input
                  type="url"
                  value={slideForm.imageUrl}
                  onChange={(e) => setSlideForm((f) => ({ ...f, imageUrl: e.target.value }))}
                  required
                />
              </label>
              <label>
                Caption (optional)
                <input
                  type="text"
                  value={slideForm.caption}
                  onChange={(e) => setSlideForm((f) => ({ ...f, caption: e.target.value }))}
                />
              </label>
              <label>
                Sort order
                <input
                  type="number"
                  value={slideForm.sortOrder}
                  onChange={(e) => setSlideForm((f) => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
                  required
                />
              </label>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button type="submit" disabled={slideSubmitting}>
                  {slideSubmitting ? "Adding…" : "Add Slide"}
                </button>
              </div>
            </form>
          </div>
        )}

        {slidesLoading ? (
          <p className="muted">Loading slides…</p>
        ) : slides.length === 0 ? (
          <p className="muted">No carousel slides yet.</p>
        ) : (
          <div className="card table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Preview</th>
                  <th>Caption</th>
                  <th>Order</th>
                  <th>Active</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {slides.map((s) => (
                  <tr key={s.id} style={{ opacity: s.isActive ? 1 : 0.5 }}>
                    <td><img src={s.imageUrl} alt="" style={{ width: 80, height: 45, objectFit: "cover", borderRadius: 4 }} /></td>
                    <td>{s.caption || <span className="muted">—</span>}</td>
                    <td>{s.sortOrder}</td>
                    <td>
                      <button className="btn-ghost" onClick={() => handleToggleActive(s.id, s.isActive)}>
                        {s.isActive ? "✓" : "—"}
                      </button>
                    </td>
                    <td>
                      <button className="btn-ghost" style={{ color: "var(--red)" }} onClick={() => handleDeleteSlide(s.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
