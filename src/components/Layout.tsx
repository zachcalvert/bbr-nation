import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { List, Moon, Sun, X } from "@phosphor-icons/react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { ChatToggle } from "./chat/ChatToggle";
import { ChatPanel } from "./chat/ChatPanel";

export function Layout() {
  const { user, loading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  if (loading) {
    return <div className="loading-screen">Loading…</div>;
  }

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
          {user ? (
            <>
              <span className="nav-username">
                {user.firstName} {user.lastName}
              </span>
              <button className="btn-ghost" onClick={handleLogout}>
                Sign out
              </button>
            </>
          ) : (
            <NavLink to="/login" className="btn-ghost">Sign in</NavLink>
          )}
          <button
            className="nav-theme-btn"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? (
              <Sun size={18} weight="duotone" />
            ) : (
              <Moon size={18} weight="duotone" />
            )}
          </button>
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
          {user ? (
            <div className="mobile-nav-user-section">
              <span className="mobile-nav-username">
                {user.firstName} {user.lastName}
              </span>
              <div className="mobile-nav-theme-row">
                <span>{theme === "dark" ? "Dark mode" : "Light mode"}</span>
                <button
                  className="nav-theme-btn"
                  onClick={toggleTheme}
                  aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {theme === "dark" ? (
                    <Sun size={20} weight="duotone" />
                  ) : (
                    <Moon size={20} weight="duotone" />
                  )}
                </button>
              </div>
              <button className="btn-ghost" onClick={handleLogout}>
                Sign out
              </button>
            </div>
          ) : (
            <div className="mobile-nav-user-section">
              <NavLink to="/login" onClick={closeMenu} className="btn-ghost">
                Sign in
              </NavLink>
            </div>
          )}
        </div>
      )}

      <main className="main">
        <Outlet />
      </main>

      {user && <ChatToggle />}
      {user && <ChatPanel />}
    </div>
  );
}
