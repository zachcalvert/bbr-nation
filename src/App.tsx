import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { RequireAuth } from "./components/RequireAuth";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { HomePage } from "./pages/HomePage";
import { SeasonsPage } from "./pages/SeasonsPage";
import { SeasonDetailPage } from "./pages/SeasonDetailPage";
import { TeamDetailPage } from "./pages/TeamDetailPage";
import { HallOfFamePage } from "./pages/HallOfFamePage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Auth-gated */}
          <Route element={<RequireAuth />}>
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="/seasons" element={<SeasonsPage />} />
              <Route path="/seasons/:year" element={<SeasonDetailPage />} />
              <Route path="/seasons/:year/teams/:teamId" element={<TeamDetailPage />} />
              <Route path="/hall-of-fame" element={<HallOfFamePage />} />
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
