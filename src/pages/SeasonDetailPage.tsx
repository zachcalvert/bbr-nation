import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Trophy, Skull } from "@phosphor-icons/react";

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
  user: { id: string; firstName: string; lastName: string } | null;
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
  matchups: Matchup[];
}

export function SeasonDetailPage() {
  const { year } = useParams<{ year: string }>();
  const [season, setSeason] = useState<Season | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!year) return;
    fetch(`/api/espn/seasons/${year}`)
      .then((res) => {
        if (!res.ok) throw new Error("Season not found");
        return res.json();
      })
      .then((data) => setSeason(data))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Error"))
      .finally(() => setLoading(false));
  }, [year]);

  if (loading) return <div className="loading-screen">Loading…</div>;
  if (error || !season) {
    return (
      <div className="page">
        <div className="empty-state">
          <p className="empty-title">{error || "Season not found"}</p>
          <Link to="/seasons" className="back-link">← All seasons</Link>
        </div>
      </div>
    );
  }

  const teamById = Object.fromEntries(season.teams.map((t) => [t.id, t]));
  const hasTies = season.teams.some((t) => t.ties > 0);
  const maxRegRank = Math.max(...season.teams.map((t) => t.regularSeasonRank ?? 0));
  const lastPlaceTeamId = season.teams.find((t) => t.regularSeasonRank === maxRegRank && maxRegRank > 0)?.id;

  // Group matchups by week
  const matchupsByWeek = season.matchups.reduce<Record<number, Matchup[]>>((acc, m) => {
    (acc[m.matchupPeriodId] ??= []).push(m);
    return acc;
  }, {});
  const weeks = Object.keys(matchupsByWeek).map(Number).sort((a, b) => a - b);

  return (
    <div className="page">
      <div className="page-header">
        <div className="breadcrumb">
          <Link to="/seasons">Seasons</Link>
          <span className="breadcrumb-sep">/</span>
          <span>{season.year}</span>
        </div>
        <h1>
          {season.leagueName}{" "}
          <span className="season-badge">{season.year}</span>
        </h1>
        <p className="page-meta">
          {season.leagueSize} teams &middot; {season.regularSeasonWeeks}-week regular season &middot;{" "}
          {season.playoffTeamCount} playoff teams
        </p>
      </div>

      <section className="section">
        <h2>Final Standings</h2>
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
                <th>Playoff</th>
              </tr>
            </thead>
            <tbody>
              {season.teams.map((team, i) => (
                <tr
                  key={team.id}
                  className={team.finalStandingsPosition === 1 ? "champion-row" : team.id === lastPlaceTeamId ? "last-place-row" : ""}
                >
                  <td className="col-rank muted">{team.finalStandingsPosition ?? team.regularSeasonRank ?? i + 1}</td>
                  <td>
                    <span className="team-name-row">
                      <Link
                        to={`/seasons/${season.year}/teams/${team.id}`}
                        className="team-link"
                      >
                        {team.logoUrl && (
                          <img src={team.logoUrl} alt="" className="team-logo-sm" />
                        )}
                        <span>{team.name}</span>
                      </Link>
                      {team.finalStandingsPosition === 1 && (
                        <span className="champion-badge">
                          <Trophy weight="duotone" size={18} />
                        </span>
                      )}
                      {team.id === lastPlaceTeamId && (
                        <span className="last-place-badge">
                          <Skull weight="bold" size={16} />
                        </span>
                      )}
                    </span>
                    {team.user && (
                      <div className="hof-manager">
                        <Link to={`/members/${team.user.id}`} className="team-link-plain">
                          {team.user.firstName} {team.user.lastName}
                        </Link>
                      </div>
                    )}
                  </td>
                  <td>{team.wins}</td>
                  <td>{team.losses}</td>
                  {hasTies && <td>{team.ties}</td>}
                  <td>{team.pointsFor.toFixed(1)}</td>
                  <td className="muted">{team.pointsAgainst.toFixed(1)}</td>
                  <td className="muted">{team.playoffSeed ? `Seed #${team.playoffSeed}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section">
        <h2>Schedule</h2>
        <div className="schedule-weeks">
          {weeks.map((week) => (
            <div key={week} className="week-block">
              <h3 className="week-label">
                {week <= season.regularSeasonWeeks
                  ? `Week ${week}`
                  : `Playoffs — Round ${week - season.regularSeasonWeeks}`}
              </h3>
              <div className="matchup-grid">
                {matchupsByWeek[week].map((m) => {
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
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
