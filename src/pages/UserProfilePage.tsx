import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Trophy, Anchor, PencilSimple } from "@phosphor-icons/react";

interface EspnTeam {
  id: string;
  seasonYear: number;
  name: string;
  abbreviation: string;
  logoUrl: string | null;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  finalStandingsPosition: number | null;
  isChampion: boolean;
  isLastPlace: boolean;
}

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  favoriteTeam: string;
  createdAt: string;
  espnTeams: EspnTeam[];
}

export function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/users/profile/${userId}`)
      .then((res) => {
        if (!res.ok) throw new Error("User not found");
        return res.json();
      })
      .then((data: { user: UserProfile }) => setProfile(data.user))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Error"))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <div className="loading-screen">Loading…</div>;

  if (error || !profile) {
    return (
      <div className="page">
        <div className="empty-state">
          <p className="empty-title">{error || "User not found"}</p>
          <Link to="/" className="back-link">← Home</Link>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profile.id;

  const totalWins = profile.espnTeams.reduce((sum, t) => sum + t.wins, 0);
  const totalLosses = profile.espnTeams.reduce((sum, t) => sum + t.losses, 0);
  const totalTies = profile.espnTeams.reduce((sum, t) => sum + t.ties, 0);
  const championships = profile.espnTeams.filter((t) => t.isChampion);
  const lastPlaces = profile.espnTeams.filter((t) => t.isLastPlace);
  const seasons = profile.espnTeams.length;

  return (
    <div className="page">
      <div className="page-header">
        <div className="profile-header-row">
          <h1>{profile.firstName} {profile.lastName}</h1>
          {isOwnProfile && (
            <Link to={`/members/${profile.id}/edit`} className="btn btn-secondary">
              <PencilSimple weight="bold" /> Edit Profile
            </Link>
          )}
        </div>
        <p className="page-meta">
          Member since {new Date(profile.createdAt).toLocaleDateString()}
          {profile.favoriteTeam && ` · ${profile.favoriteTeam} fan`}
        </p>
      </div>

      {seasons > 0 && (
        <section className="section">
          <h2>All-Time Stats</h2>
          <div className="stats-banner">
            <div className="stat-item">
              <span className="stat-value">{seasons}</span>
              <span className="stat-label">Season{seasons !== 1 ? "s" : ""}</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {totalWins}–{totalLosses}{totalTies > 0 ? `–${totalTies}` : ""}
              </span>
              <span className="stat-label">All-Time Record</span>
            </div>
            <div className="stat-item">
              <Trophy weight="duotone" className="stat-icon champion-icon" />
              <span className="stat-value">{championships.length}</span>
              <span className="stat-label">Championship{championships.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="stat-item">
              <Anchor weight="bold" className="stat-icon last-place-icon" />
              <span className="stat-value">{lastPlaces.length}</span>
              <span className="stat-label">Last Place{lastPlaces.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <h2>Teams</h2>
        {profile.espnTeams.length === 0 ? (
          <p className="muted">No teams on record.</p>
        ) : (
          <div className="card table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Season</th>
                  <th>Team</th>
                  <th>W</th>
                  <th>L</th>
                  <th>PF</th>
                  <th>Finish</th>
                </tr>
              </thead>
              <tbody>
                {profile.espnTeams.map((team) => (
                  <tr key={team.id} className={team.isChampion ? "champion-row" : team.isLastPlace ? "last-place-row" : ""}>
                    <td data-label="Season">
                      <Link to={`/seasons/${team.seasonYear}`} className="team-link-plain">
                        {team.seasonYear}
                      </Link>
                    </td>
                    <td data-label="Team">
                      <div className="team-name-row">
                        <Link to={`/seasons/${team.seasonYear}/teams/${team.id}`} className="team-link">
                          {team.logoUrl && <img src={team.logoUrl} alt="" className="team-logo-sm" />}
                          <span>{team.name}</span>
                        </Link>
                        {team.isChampion && <Trophy weight="duotone" className="champion-badge" />}
                        {team.isLastPlace && <Anchor weight="bold" className="last-place-badge" />}
                      </div>
                    </td>
                    <td data-label="W">{team.wins}</td>
                    <td data-label="L">{team.losses}</td>
                    <td data-label="PF">{team.pointsFor.toFixed(1)}</td>
                    <td data-label="Finish" className="muted">
                      {team.finalStandingsPosition ? `#${team.finalStandingsPosition}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
