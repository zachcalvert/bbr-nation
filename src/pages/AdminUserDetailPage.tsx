import { useEffect, useState, FormEvent } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";

interface EspnTeamLink {
  id: string;
  espnTeamId: number;
  seasonYear: number;
  name: string;
  abbreviation: string;
}

interface EspnTeamSearchResult {
  id: string;
  espnTeamId: number;
  seasonYear: number;
  name: string;
  abbreviation: string;
  userId: string | null;
  user: { id: string; firstName: string; lastName: string } | null;
}

interface AdminUserDetail {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  groupmeId: string;
  favoriteTeam: string;
  isAdmin: boolean;
  createdAt: string;
  espnTeams: EspnTeamLink[];
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

  // Change password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // User form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [groupmeId, setGroupmeId] = useState("");
  const [favoriteTeam, setFavoriteTeam] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  // Delete state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // ESPN teams state
  const [espnTeams, setEspnTeams] = useState<EspnTeamLink[]>([]);
  const [allTeams, setAllTeams] = useState<EspnTeamSearchResult[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [teamsError, setTeamsError] = useState("");
  const [filterText, setFilterText] = useState("");
  const [teamActionError, setTeamActionError] = useState("");

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
        setGroupmeId(u.groupmeId);
        setFavoriteTeam(u.favoriteTeam);
        setIsAdmin(u.isAdmin);
        setEspnTeams(u.espnTeams);
      })
      .catch((err: Error) => setError(err.message || "Failed to load user"))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    fetch("/api/admin/espn-teams")
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load ESPN teams: ${res.status}`);
        return res.json();
      })
      .then((data: { teams: EspnTeamSearchResult[] }) => setAllTeams(data.teams))
      .catch((err: Error) => setTeamsError(err.message || "Failed to load ESPN teams"))
      .finally(() => setTeamsLoading(false));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaveError("");
    setSaveSuccess(false);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, groupmeId, favoriteTeam, isAdmin }),
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

  const linkedIds = new Set(espnTeams.map((t) => t.id));

  const filteredTeams = filterText.trim()
    ? allTeams.filter((t) => {
        const q = filterText.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          t.abbreviation.toLowerCase().includes(q) ||
          String(t.seasonYear).includes(q)
        );
      })
    : [];

  async function handleAssign(team: EspnTeamSearchResult) {
    if (!userId) return;
    setTeamActionError("");
    try {
      const res = await fetch(`/api/admin/espn-teams/${team.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error || "Failed to link team");
      }
      // Add to current list and remove from search results
      setEspnTeams((prev) => [
        { id: team.id, espnTeamId: team.espnTeamId, seasonYear: team.seasonYear, name: team.name, abbreviation: team.abbreviation },
        ...prev,
      ].sort((a, b) => b.seasonYear - a.seasonYear));
      setAllTeams((prev) => prev.filter((t) => t.id !== team.id));
    } catch (err) {
      setTeamActionError(err instanceof Error ? err.message : "Failed to link team");
    }
  }

  async function handleRemove(teamId: string) {
    setTeamActionError("");
    try {
      const res = await fetch(`/api/admin/espn-teams/${teamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: null }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error || "Failed to unlink team");
      }
      setEspnTeams((prev) => prev.filter((t) => t.id !== teamId));
    } catch (err) {
      setTeamActionError(err instanceof Error ? err.message : "Failed to unlink team");
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }
    setPasswordSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error || `Save failed: ${res.status}`);
      }
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess(true);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleDelete() {    if (!userId) return;
    setDeleteError("");
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error || "Failed to delete user");
      }
      navigate("/admin");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete user");
      setDeleting(false);
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
        {!user.isAdmin && (
          <button
            className="btn-danger"
            style={{ marginTop: "0.75rem" }}
            onClick={() => { setDeleteError(""); setShowDeleteModal(true); }}
          >
            Delete User
          </button>
        )}
      </div>

      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Delete {user.firstName} {user.lastName}?</h3>
            <p>
              This will permanently delete this user account and unlink all associated ESPN teams.
              This action cannot be undone.
            </p>
            {deleteError && <p className="error" style={{ marginBottom: "1rem" }}>{deleteError}</p>}
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting…" : "Delete User"}
              </button>
            </div>
          </div>
        </div>
      )}

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

      <section className="section">
        <h2>Change Password</h2>
        <div className="card" style={{ maxWidth: 480 }}>
          {passwordSuccess && (
            <p className="success">Password updated successfully.</p>
          )}
          {passwordError && <p className="error">{passwordError}</p>}
          <form onSubmit={handlePasswordSubmit}>
            <label htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <div className="form-actions">
              <button type="submit" disabled={passwordSaving}>
                {passwordSaving ? "Saving…" : "Update Password"}
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="section">
        <h2>ESPN Teams</h2>

        {teamActionError && <p className="error">{teamActionError}</p>}

        {/* Current teams */}
        {espnTeams.length === 0 ? (
          <p className="muted" style={{ marginBottom: "1.5rem" }}>
            No ESPN teams linked yet.
          </p>
        ) : (
          <div className="card" style={{ maxWidth: 600, marginBottom: "1.5rem", padding: 0 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border, #e2e8f0)" }}>
                  <th style={{ textAlign: "left", padding: "0.75rem 1rem", fontWeight: 600 }}>Team</th>
                  <th style={{ textAlign: "left", padding: "0.75rem 1rem", fontWeight: 600 }}>Abbr</th>
                  <th style={{ textAlign: "left", padding: "0.75rem 1rem", fontWeight: 600 }}>Season</th>
                  <th style={{ padding: "0.75rem 1rem" }} />
                </tr>
              </thead>
              <tbody>
                {espnTeams.map((team) => (
                  <tr
                    key={team.id}
                    style={{ borderBottom: "1px solid var(--border, #e2e8f0)" }}
                  >
                    <td style={{ padding: "0.75rem 1rem" }}>{team.name}</td>
                    <td style={{ padding: "0.75rem 1rem", color: "var(--muted, #64748b)" }}>
                      {team.abbreviation}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", color: "var(--muted, #64748b)" }}>
                      {team.seasonYear}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                      <button
                        className="btn-secondary"
                        style={{ fontSize: "0.8rem", padding: "0.25rem 0.6rem" }}
                        onClick={() => handleRemove(team.id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Filter & link */}
        <div className="card" style={{ maxWidth: 600 }}>
          <h3 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1rem" }}>
            Link a Team
          </h3>

          {teamsError && <p className="error">{teamsError}</p>}

          <label htmlFor="teamFilter">Filter by name, abbreviation, or year</label>
          <input
            id="teamFilter"
            type="text"
            placeholder="e.g. Lions or 2023"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            disabled={teamsLoading}
          />

          {filterText.trim() && (
            <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {filteredTeams.length === 0 ? (
                <p className="muted" style={{ fontSize: "0.85rem" }}>No teams match.</p>
              ) : (
                filteredTeams.map((team) => {
                  const alreadyLinked = linkedIds.has(team.id);
                  const ownedByOther = team.userId && team.userId !== userId;
                  return (
                    <div
                      key={team.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.6rem 0.75rem",
                        borderRadius: "6px",
                        border: "1px solid var(--border, #e2e8f0)",
                        background: alreadyLinked ? "var(--surface-alt, #f8fafc)" : "transparent",
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 500 }}>{team.name}</span>
                        <span className="muted" style={{ marginLeft: "0.5rem", fontSize: "0.85rem" }}>
                          {team.abbreviation} · {team.seasonYear}
                        </span>
                        {ownedByOther && team.user && (
                          <span style={{ marginLeft: "0.5rem", fontSize: "0.78rem", color: "var(--warning, #d97706)" }}>
                            (linked to {team.user.firstName} {team.user.lastName})
                          </span>
                        )}
                      </div>
                      {alreadyLinked ? (
                        <span className="muted" style={{ fontSize: "0.85rem" }}>✓ Linked</span>
                      ) : (
                        <button
                          className="btn-secondary"
                          style={{ fontSize: "0.8rem", padding: "0.25rem 0.6rem" }}
                          onClick={() => handleAssign(team)}
                        >
                          {ownedByOther ? "Reassign" : "Link"}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
