import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  espnId: string;
  isAdmin: boolean;
  createdAt: string;
}

export function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin")
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load admin data: ${res.status}`);
        return res.json();
      })
      .then((data) => setUsers(data.users))
      .catch((err: Error) => setError(err.message || "Failed to load admin data"))
      .finally(() => setLoading(false));
  }, []);

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

      <section className="section">
        <h2>Users</h2>
        <div className="card table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>ESPN ID</th>
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
                  <td className="muted">{u.espnId}</td>
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
    </div>
  );
}
