import { useEffect, useState, FormEvent } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";

interface AdminUserDetail {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  espnId: string;
  groupmeId: string;
  favoriteTeam: string;
  isAdmin: boolean;
  createdAt: string;
}

export function AdminUserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [espnId, setEspnId] = useState("");
  const [groupmeId, setGroupmeId] = useState("");
  const [favoriteTeam, setFavoriteTeam] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/admin/users/${userId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load user: ${res.status}`);
        return res.json();
      })
      .then((data: { user: AdminUserDetail }) => {
        const u = data.user;
        setUser(u);
        setFirstName(u.firstName);
        setLastName(u.lastName);
        setEmail(u.email);
        setEspnId(u.espnId);
        setGroupmeId(u.groupmeId);
        setFavoriteTeam(u.favoriteTeam);
        setIsAdmin(u.isAdmin);
      })
      .catch((err: Error) => setError(err.message || "Failed to load user"))
      .finally(() => setLoading(false));
  }, [userId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaveError("");
    setSaveSuccess(false);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, espnId, groupmeId, favoriteTeam, isAdmin }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error || `Save failed: ${res.status}`);
      }
      const data = (await res.json()) as { user: AdminUserDetail };
      setUser(data.user);
      setSaveSuccess(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="loading-screen">Loading…</div>;

  if (error || !user) {
    return (
      <div className="page">
        <div className="empty-state">
          <p className="empty-title">{error || "User not found"}</p>
          <Link to="/admin" className="back-link">
            ← Back to admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="breadcrumb">
          <Link to="/admin">Admin</Link>
          <span className="breadcrumb-sep">/</span>
          <span>
            {user.firstName} {user.lastName}
          </span>
        </div>
        <h1>
          {user.firstName} {user.lastName}
        </h1>
        <p className="muted">
          Member since {new Date(user.createdAt).toLocaleDateString()}
        </p>
      </div>

      <section className="section">
        <h2>Edit User</h2>
        <div className="card" style={{ maxWidth: 480 }}>
          {saveSuccess && (
            <p className="success">Changes saved successfully.</p>
          )}
          {saveError && <p className="error">{saveError}</p>}
          <form onSubmit={handleSubmit}>
            <label htmlFor="firstName">First Name</label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />

            <label htmlFor="lastName">Last Name</label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />

            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label htmlFor="espnId">ESPN ID</label>
            <input
              id="espnId"
              type="text"
              value={espnId}
              onChange={(e) => setEspnId(e.target.value)}
              required
            />

            <label htmlFor="groupmeId">GroupMe ID</label>
            <input
              id="groupmeId"
              type="text"
              value={groupmeId}
              onChange={(e) => setGroupmeId(e.target.value)}
              required
            />

            <label htmlFor="favoriteTeam">Favorite Team</label>
            <input
              id="favoriteTeam"
              type="text"
              value={favoriteTeam}
              onChange={(e) => setFavoriteTeam(e.target.value)}
              required
            />

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
              />
              Admin
            </label>

            <div className="form-actions">
              <button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate("/admin")}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
