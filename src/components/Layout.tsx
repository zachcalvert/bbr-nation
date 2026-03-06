import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="layout">
      <nav className="nav">
        <NavLink to="/" className="nav-brand" end>
          BBR Nation
        </NavLink>

        <div className="nav-links">
          <NavLink
            to="/"
            end
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          >
            Home
          </NavLink>
          <NavLink
            to="/seasons"
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          >
            Seasons
          </NavLink>
        </div>

        <div className="nav-user">
          {user && (
            <>
              <span className="nav-username">
                {user.firstName} {user.lastName}
              </span>
              <button className="btn-ghost" onClick={handleLogout}>
                Sign out
              </button>
            </>
          )}
        </div>
      </nav>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
