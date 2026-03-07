import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Trophy } from "@phosphor-icons/react";

interface RosterEntry {
  id: string;
  espnPlayerId: number;
  fullName: string;
  position: string;
  lineupSlot: string;
  nflTeam: string;
  nflTeamAbbreviation: string;
  totalPoints: number;
  injuryStatus: string | null;
}

interface RosterWeek {
  id: string;
  scoringPeriodId: number;
  entries: RosterEntry[];
}

interface Matchup {
  id: string;
  seasonYear: number;
  matchupPeriodId: number;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
}

interface TeamUser {
  id: string;
  firstName: string;
  lastName: string;
}

interface Team {
  id: string;
  espnTeamId: number;
  seasonYear: number;
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
  user: TeamUser | null;
  rosterWeeks: RosterWeek[];
  homeMatchups: Matchup[];
  awayMatchups: Matchup[];
}

interface SeasonTeam {
  id: string;
  name: string;
  abbreviation: string;
}

export function TeamDetailPage() {
  const { year, teamId } = useParams<{ year: string; teamId: string }>();
  const [team, setTeam] = useState<Team | null>(null);
  const [seasonTeams, setSeasonTeams] = useState<SeasonTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeWeek, setActiveWeek] = useState<number | null>(null);

  useEffect(() => {
    if (!year || !teamId) return;
    Promise.all([
      fetch(`/api/espn/seasons/${year}/teams/${teamId}`).then((r) => {
        if (!r.ok) throw new Error("Team not found");
        return r.json() as Promise<Team>;
      }),
      fetch(`/api/espn/seasons/${year}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((s) => (s ? (s.teams as SeasonTeam[]) : [])),
    ])
      .then(([teamData, teams]) => {
        setTeam(teamData);
        setSeasonTeams(teams);
        if (teamData.rosterWeeks.length > 0) {
          setActiveWeek(
            teamData.rosterWeeks[teamData.rosterWeeks.length - 1].scoringPeriodId
          );
        }
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Error"))
      .finally(() => setLoading(false));
  }, [year, teamId]);

  if (loading) return <div className="loading-screen">Loading…</div>;
  if (error || !team) {
    return (
      <div className="page">
        <div className="empty-state">
          <p className="empty-title">{error || "Team not found"}</p>
          <Link to={`/seasons/${year}`} className="back-link">
            ← Back to season
          </Link>
        </div>
      </div>
    );
  }

  const teamById = Object.fromEntries(seasonTeams.map((t) => [t.id, t]));

  // Merge home + away matchups, sorted by week
  const allMatchups = [
    ...team.homeMatchups.map((m) => ({ ...m, isHome: true as const })),
    ...team.awayMatchups.map((m) => ({ ...m, isHome: false as const })),
  ].sort((a, b) => a.matchupPeriodId - b.matchupPeriodId);

  const activeRoster = team.rosterWeeks.find((w) => w.scoringPeriodId === activeWeek);

  // Partition roster into starters and bench
  const BENCH_SLOTS = new Set(["Bench", "IR"]);
  const starters = activeRoster?.entries.filter((e) => !BENCH_SLOTS.has(e.lineupSlot)) ?? [];
  const bench = activeRoster?.entries.filter((e) => BENCH_SLOTS.has(e.lineupSlot)) ?? [];

  return (
    <div className="page">
      <div className="page-header">
        <div className="breadcrumb">
          <Link to="/seasons">Seasons</Link>
          <span className="breadcrumb-sep">/</span>
          <Link to={`/seasons/${team.seasonYear}`}>{team.seasonYear}</Link>
          <span className="breadcrumb-sep">/</span>
          <span>{team.name}</span>
        </div>

        <div className="team-hero">
          {team.logoUrl && (
            <img src={team.logoUrl} alt="" className="team-logo-lg" />
          )}
          <div>
            <h1>{team.name}</h1>
            <p className="team-record">
              {team.wins}–{team.losses}
              {team.ties > 0 ? `–${team.ties}` : ""} &nbsp;·&nbsp;{" "}
              {team.pointsFor.toFixed(1)} PF
              {team.regularSeasonRank && (
                <span className="badge">Seed #{team.regularSeasonRank}</span>
              )}
              {team.finalStandingsPosition === 1 && (
                <span className="badge champion">
                  <Trophy weight="duotone" size={14} />
                  Champion
                </span>
              )}
            </p>
            {team.user && (
              <p className="team-manager">
                Manager:{" "}
                <Link to={`/members/${team.user.id}`}>
                  {team.user.firstName} {team.user.lastName}
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="two-col">
        {/* Schedule column */}
        <section className="section">
          <h2>Schedule</h2>
          <div className="card table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Wk</th>
                  <th>Result</th>
                  <th>Score</th>
                  <th>Opponent</th>
                </tr>
              </thead>
              <tbody>
                {allMatchups.map((m) => {
                  const myScore = m.isHome ? m.homeScore : m.awayScore;
                  const oppScore = m.isHome ? m.awayScore : m.homeScore;
                  const oppId = m.isHome ? m.awayTeamId : m.homeTeamId;
                  const opp = teamById[oppId];
                  const won = myScore > oppScore;
                  return (
                    <tr key={m.id}>
                      <td data-label="Wk" className="muted">{m.matchupPeriodId}</td>
                      <td data-label="Result" className={won ? "win" : "loss"}>{won ? "W" : "L"}</td>
                      <td data-label="Score">
                        {myScore.toFixed(2)}–{oppScore.toFixed(2)}
                      </td>
                      <td data-label="Opponent">
                        {opp ? (
                          <Link
                            to={`/seasons/${team.seasonYear}/teams/${oppId}`}
                            className="team-link-plain"
                          >
                            {opp.name}
                          </Link>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Roster column */}
        {team.rosterWeeks.length > 0 && (
          <section className="section">
            <h2>Weekly Roster</h2>
            <div className="week-tabs">
              {team.rosterWeeks.map((w) => (
                <button
                  key={w.scoringPeriodId}
                  className={`week-tab ${activeWeek === w.scoringPeriodId ? "active" : ""}`}
                  onClick={() => setActiveWeek(w.scoringPeriodId)}
                >
                  {w.scoringPeriodId}
                </button>
              ))}
            </div>

            {activeRoster && (
              <div className="card table-card">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Slot</th>
                      <th>Player</th>
                      <th>Pos</th>
                      <th>NFL</th>
                      <th className="col-right">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {starters.map((e) => (
                      <tr key={e.id}>
                        <td data-label="Slot" className="slot-label">{e.lineupSlot}</td>
                        <td data-label="Player">
                          {e.fullName}
                          {e.injuryStatus && (
                            <span className="injury-tag">{e.injuryStatus}</span>
                          )}
                        </td>
                        <td data-label="Pos" className="muted">{e.position}</td>
                        <td data-label="NFL" className="muted">{e.nflTeamAbbreviation}</td>
                        <td data-label="Pts" className="col-right">{e.totalPoints.toFixed(2)}</td>
                      </tr>
                    ))}
                    {bench.length > 0 && (
                      <>
                        <tr className="bench-divider">
                          <td colSpan={5}>Bench</td>
                        </tr>
                        {bench.map((e) => (
                          <tr key={e.id} className="bench-row">
                            <td data-label="Slot" className="slot-label muted">{e.lineupSlot}</td>
                            <td data-label="Player" className="muted">
                              {e.fullName}
                              {e.injuryStatus && (
                                <span className="injury-tag">{e.injuryStatus}</span>
                              )}
                            </td>
                            <td data-label="Pos" className="muted">{e.position}</td>
                            <td data-label="NFL" className="muted">{e.nflTeamAbbreviation}</td>
                            <td data-label="Pts" className="col-right muted">{e.totalPoints.toFixed(2)}</td>
                          </tr>
                        ))}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
