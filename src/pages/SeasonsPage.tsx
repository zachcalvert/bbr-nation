import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface SeasonSummary {
  year: number;
  leagueName: string;
  leagueSize: number;
  regularSeasonWeeks: number;
  playoffWeeks: number;
  playoffTeamCount: number;
  syncedAt: string;
  teams: {
    id: string;
    name: string;
    wins: number;
    losses: number;
    ties: number;
    pointsFor: number;
    regularSeasonRank: number | null;
    finalStandingsPosition: number | null;
  }[];
}

export function SeasonsPage() {
  const [seasons, setSeasons] = useState<SeasonSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/espn/seasons")
      .then((res) => res.json())
      .then((data) => setSeasons(data))
      .catch(() => setError("Failed to load seasons"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen">Loading…</div>;

  if (error) {
    return (
      <div className="page">
        <div className="empty-state">
          <p className="empty-title">Could not load seasons</p>
          <p className="empty-sub">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>All Seasons</h1>
        <span className="muted">{seasons.length} seasons</span>
      </div>

      {seasons.length === 0 ? (
        <div className="empty-state">
          <p className="empty-title">No seasons synced yet</p>
          <p className="empty-sub">Trigger a sync to get started.</p>
        </div>
      ) : (
        <div className="seasons-grid">
          {seasons.map((s) => {
            const champion = s.teams.find((t) => t.finalStandingsPosition === 1);
            return (
              <Link key={s.year} to={`/seasons/${s.year}`} className="card season-card">
                <div className="season-card-year">{s.year}</div>
                <div className="season-card-meta">
                  {s.leagueSize} teams &middot; {s.regularSeasonWeeks}-week regular season
                </div>
                {champion ? (
                  <div className="season-card-champ">
                    <span className="trophy">🏆</span>
                    <span>{champion.name}</span>
                  </div>
                ) : (
                  <div className="season-card-champ muted">Season in progress</div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
