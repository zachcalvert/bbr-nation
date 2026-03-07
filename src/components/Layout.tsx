import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { List, X } from "@phosphor-icons/react";
import { useAuth } from "../context/AuthContext";
import { ChatToggle } from "./chat/ChatToggle";
import { ChatPanel } from "./chat/ChatPanel";

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  function closeMenu() {
    setMenuOpen(false);
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

        <button
          className="nav-hamburger"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Menu"
        >
          {menuOpen ? <X size={22} /> : <List size={22} />}
        </button>
      </nav>

      {menuOpen && (
        <div className="mobile-nav-menu">
          <NavLink
            to="/"
            end
            onClick={closeMenu}
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Home
          </NavLink>
          <NavLink
            to="/seasons"
            onClick={closeMenu}
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Seasons
          </NavLink>
          <NavLink
            to="/hall-of-fame"
            onClick={closeMenu}
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Hall of Fame
          </NavLink>
          {user?.isAdmin && (
            <NavLink
              to="/admin"
              onClick={closeMenu}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              Admin
            </NavLink>
          )}
          {user && (
            <div className="mobile-nav-user-section">
              <span className="mobile-nav-username">
                {user.firstName} {user.lastName}
              </span>
              <button className="btn-ghost" onClick={handleLogout}>
                Sign out
              </button>
            </div>
          )}
        </div>
      )}

      <main className="main">
        <Outlet />
      </main>

      <ChatToggle />
      <ChatPanel />
    </div>
  );
}
