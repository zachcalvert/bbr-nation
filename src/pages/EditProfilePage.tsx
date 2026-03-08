import { useEffect, useState, FormEvent } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function EditProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [favoriteTeam, setFavoriteTeam] = useState("");
  const [initialized, setInitialized] = useState(false);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser || currentUser.id !== userId) {
      navigate(currentUser ? `/members/${userId}` : "/", { replace: true });
      return;
    }
    if (!initialized) {
      setFirstName(currentUser.firstName);
      setLastName(currentUser.lastName);
      setEmail(currentUser.email);
      setFavoriteTeam(currentUser.favoriteTeam ?? "");
      setInitialized(true);
    }
  }, [authLoading, currentUser, userId, initialized, navigate]);

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters");
      return;
    }
    setPasswordSaving(true);
    try {
      const res = await fetch(`/api/users/profile/${userId}/password`, {        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to update password");
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess(true);
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaveError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/users/profile/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, favoriteTeam }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to save");
      }
      navigate(`/members/${userId}`);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || !initialized) return <div className="loading-screen">Loading…</div>;

  return (
    <div className="page">
      <div className="page-header">
        <nav className="breadcrumb">
          <Link to={`/members/${userId}`} className="breadcrumb-link">Profile</Link>
          <span className="breadcrumb-sep">›</span>
          <span>Edit</span>
        </nav>
        <h1>Edit Profile</h1>
      </div>

      <section className="section">
        <div className="card profile-edit-card">
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="favoriteTeam">Favorite NFL Team</label>
              <input
                id="favoriteTeam"
                type="text"
                value={favoriteTeam}
                onChange={(e) => setFavoriteTeam(e.target.value)}
              />
            </div>
            {saveError && <p className="error-text">{saveError}</p>}
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
              <Link to={`/members/${userId}`} className="btn btn-secondary">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </section>

      <section className="section">
        <div className="card profile-edit-card">
          <h2 style={{ marginTop: 0 }}>Change Password</h2>
          <form onSubmit={handlePasswordSubmit} className="admin-form">
            <div className="form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            {passwordError && <p className="error-text">{passwordError}</p>}
            {passwordSuccess && <p className="success-text">Password updated successfully.</p>}
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={passwordSaving}>
                {passwordSaving ? "Saving…" : "Update Password"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
