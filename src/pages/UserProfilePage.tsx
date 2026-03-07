import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

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

  const championships = profile.espnTeams.filter((t) => t.finalStandingsPosition === 1);

  return (
    <div className="page">
      <div className="page-header">
        <h1>{profile.firstName} {profile.lastName}</h1>
        <p className="page-meta">
          Member since {new Date(profile.createdAt).toLocaleDateString()}
          {profile.favoriteTeam && ` · ${profile.favoriteTeam} fan`}
        </p>
        {championships.length > 0 && (
          <p className="page-meta">
            🏆 {championships.length} championship{championships.length !== 1 ? "s" : ""}
            {" "}({championships.map((t) => t.seasonYear).join(", ")})
          </p>
        )}
      </div>

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
                  <tr key={team.id} className={team.finalStandingsPosition === 1 ? "champion-row" : ""}>
                    <td>
                      <Link to={`/seasons/${team.seasonYear}`} className="team-link-plain">
                        {team.seasonYear}
                      </Link>
                    </td>
                    <td>
                      <Link to={`/seasons/${team.seasonYear}/teams/${team.id}`} className="team-link">
                        {team.logoUrl && <img src={team.logoUrl} alt="" className="team-logo-sm" />}
                        <span>{team.name}</span>
                      </Link>
                      {team.finalStandingsPosition === 1 && (
                        <span className="champion-badge">🏆</span>
                      )}
                    </td>
                    <td>{team.wins}</td>
                    <td>{team.losses}</td>
                    <td>{team.pointsFor.toFixed(1)}</td>
                    <td className="muted">
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
