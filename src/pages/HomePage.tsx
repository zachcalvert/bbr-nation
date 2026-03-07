import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

interface Team {
  id: string;
  espnTeamId: number;
  name: string;
  abbreviation: string;
  logoUrl: string | null;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  playoffSeed: number | null;
  finalStandingsPosition: number | null;
  regularSeasonRank: number | null;
}

interface Matchup {
  id: string;
  matchupPeriodId: number;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
}

interface Season {
  year: number;
  leagueName: string;
  leagueSize: number;
  regularSeasonWeeks: number;
  playoffWeeks: number;
  playoffTeamCount: number;
  syncedAt: string;
  teams: Team[];
  matchups?: Matchup[];
}

interface SyncStatus {
  running: boolean;
  lastStartedAt: string | null;
  lastCompletedAt: string | null;
  lastError: string | null;
}

function SyncPanel({ onSyncComplete }: { onSyncComplete: () => void }) {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [triggering, setTriggering] = useState(false);
  const wasRunning = useRef(false);

  function fetchStatus() {
    return fetch("/api/espn/status")
      .then((r) => r.json())
      .then((d) => setStatus(d.sync));
  }

  // Poll while a sync is in flight; detect completion to reload seasons
  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    if (!status) return;
    if (status.running) {
      wasRunning.current = true;
      const id = setInterval(fetchStatus, 2000);
      return () => clearInterval(id);
    } else if (wasRunning.current) {
      wasRunning.current = false;
      onSyncComplete();
    }
  }, [status?.running]);

  async function handleBackfill() {
    setTriggering(true);
    await fetch("/api/espn/sync/backfill", { method: "POST" });
    setTriggering(false);
    // Give the server a beat to flip running=true, then start polling
    setTimeout(fetchStatus, 500);
  }

  const running = status?.running ?? false;
  const lastCompleted = status?.lastCompletedAt
    ? new Date(status.lastCompletedAt).toLocaleString()
    : null;

  return (
    <div className="sync-panel">
      <div className="sync-info">
        {running ? (
          <span className="sync-status syncing">
            <span className="sync-dot" /> Syncing…
          </span>
        ) : status?.lastError ? (
          <span className="sync-status error">Error: {status.lastError}</span>
        ) : lastCompleted ? (
          <span className="sync-status idle">Last synced {lastCompleted}</span>
        ) : (
          <span className="sync-status idle">Never synced</span>
        )}
      </div>
      <button
        className="btn-sync"
        onClick={handleBackfill}
        disabled={running || triggering}
      >
        {running ? "Syncing…" : "Backfill all seasons"}
      </button>
    </div>
  );
}

export function HomePage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function loadSeasons() {
    fetch("/api/espn/seasons")
      .then((res) => res.json())
      .then((data) => setSeasons(data))
      .catch(() => setError("Failed to load season data"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadSeasons();
  }, []);

  if (loading) return <div className="loading-screen">Loading…</div>;

  if (error) {
    return (
      <div className="page">
        <SyncPanel onSyncComplete={loadSeasons} />
        <div className="empty-state">
          <p className="empty-title">Could not load data</p>
          <p className="empty-sub">{error}</p>
        </div>
      </div>
    );
  }

  if (seasons.length === 0) {
    return (
      <div className="page">
        <SyncPanel onSyncComplete={loadSeasons} />
        <div className="empty-state" style={{ marginTop: "3rem" }}>
          <p className="empty-title">No seasons synced yet</p>
          <p className="empty-sub">Hit "Backfill all seasons" to pull in ESPN data.</p>
        </div>
      </div>
    );
  }

  const current = seasons[0]; // most recent (ordered desc by year)
  const teamById = Object.fromEntries(current.teams.map((t) => [t.id, t]));
  const hasTies = current.teams.some((t) => t.ties > 0);
  const maxRegRank = Math.max(...current.teams.map((t) => t.regularSeasonRank ?? 0));
  const lastPlaceTeamId = current.teams.find((t) => t.regularSeasonRank === maxRegRank && maxRegRank > 0)?.id;

  // Group matchups by week and find the last played week
  const matchupsByWeek = (current.matchups ?? []).reduce<Record<number, Matchup[]>>((acc, m) => {
    (acc[m.matchupPeriodId] ??= []).push(m);
    return acc;
  }, {});
  const weeks = Object.keys(matchupsByWeek).map(Number).sort((a, b) => b - a);
  const lastWeek = weeks[0];
  const recentMatchups = lastWeek !== undefined ? matchupsByWeek[lastWeek] : [];

  return (
    <div className="page">
      <div className="page-header">
        <h1>{current.leagueName}</h1>
        <span className="season-badge">{current.year} Season</span>
      </div>

      <SyncPanel onSyncComplete={loadSeasons} />

      <section className="section">
        <div className="section-header">
          <h2>Standings</h2>
          <Link to={`/seasons/${current.year}`} className="section-link">
            Full season →
          </Link>
        </div>
        <div className="card table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th className="col-rank">#</th>
                <th>Team</th>
                <th>W</th>
                <th>L</th>
                {hasTies && <th>T</th>}
                <th>PF</th>
                <th>PA</th>
              </tr>
            </thead>
            <tbody>
              {current.teams.map((team, i) => (
                <tr key={team.id} className={team.finalStandingsPosition === 1 ? "champion-row" : team.id === lastPlaceTeamId ? "last-place-row" : ""}>
                  <td data-label="#" className="col-rank muted">{team.finalStandingsPosition ?? team.regularSeasonRank ?? i + 1}</td>
                  <td data-label="Team">
                    <Link to={`/seasons/${current.year}/teams/${team.id}`} className="team-link">
                      {team.logoUrl && (
                        <img src={team.logoUrl} alt="" className="team-logo-sm" />
                      )}
                      <span>{team.name}</span>
                    </Link>
                    {team.finalStandingsPosition === 1 && (
                      <span className="champion-badge">🏆</span>
                    )}
                    {team.id === lastPlaceTeamId && (
                      <span className="last-place-badge">💎</span>
                    )}
                  </td>
                  <td data-label="W">{team.wins}</td>
                  <td data-label="L">{team.losses}</td>
                  {hasTies && <td data-label="T">{team.ties}</td>}
                  <td data-label="PF">{team.pointsFor.toFixed(1)}</td>
                  <td data-label="PA" className="muted">{team.pointsAgainst.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {recentMatchups.length > 0 && (
        <section className="section">
          <h2>Week {lastWeek} Results</h2>
          <div className="matchup-grid">
            {recentMatchups.map((m) => {
              const home = teamById[m.homeTeamId];
              const away = teamById[m.awayTeamId];
              const homeWon = m.homeScore > m.awayScore;
              return (
                <div key={m.id} className="card matchup-card">
                  <div className={`matchup-row ${homeWon ? "winner" : "loser"}`}>
                    <span className="matchup-abbr">{home?.abbreviation ?? "?"}</span>
                    <span className="matchup-name">{home?.name ?? "Unknown"}</span>
                    <span className="matchup-score">{m.homeScore.toFixed(2)}</span>
                  </div>
                  <div className={`matchup-row ${!homeWon ? "winner" : "loser"}`}>
                    <span className="matchup-abbr">{away?.abbreviation ?? "?"}</span>
                    <span className="matchup-name">{away?.name ?? "Unknown"}</span>
                    <span className="matchup-score">{m.awayScore.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
