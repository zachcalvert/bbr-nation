import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ChatToggle } from "./chat/ChatToggle";
import { ChatPanel } from "./chat/ChatPanel";

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
          <NavLink
            to="/hall-of-fame"
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          >
            Hall of Fame
          </NavLink>
          {user?.isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              Admin
            </NavLink>
          )}
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

      <ChatToggle />
      <ChatPanel />
    </div>
  );
}
