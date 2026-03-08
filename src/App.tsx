import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";
import { ThemeProvider } from "./context/ThemeContext";
import { RequireAuth } from "./components/RequireAuth";
import { RequireAdmin } from "./components/RequireAdmin";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { HomePage } from "./pages/HomePage";
import { SeasonsPage } from "./pages/SeasonsPage";
import { SeasonDetailPage } from "./pages/SeasonDetailPage";
import { TeamDetailPage } from "./pages/TeamDetailPage";
import { HallOfFamePage } from "./pages/HallOfFamePage";
import { AdminPage } from "./pages/AdminPage";
import { AdminUserDetailPage } from "./pages/AdminUserDetailPage";
import { UserProfilePage } from "./pages/UserProfilePage";
import { EditProfilePage } from "./pages/EditProfilePage";

function App() {
  return (
    <ThemeProvider>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Auth-gated */}
          <Route element={<RequireAuth />}>
            <Route
              element={
                <ChatProvider>
                  <Layout />
                </ChatProvider>
              }
            >
              <Route index element={<HomePage />} />
              <Route path="/seasons" element={<SeasonsPage />} />
              <Route path="/seasons/:year" element={<SeasonDetailPage />} />
              <Route path="/seasons/:year/teams/:teamId" element={<TeamDetailPage />} />
              <Route path="/hall-of-fame" element={<HallOfFamePage />} />
              <Route path="/members/:userId" element={<UserProfilePage />} />
              <Route path="/members/:userId/edit" element={<EditProfilePage />} />

              {/* Admin-only */}
              <Route element={<RequireAdmin />}>
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/admin/users/:userId" element={<AdminUserDetailPage />} />
              </Route>
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
