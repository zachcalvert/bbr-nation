import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trophy, AnchorSimple, UserCircle } from "@phosphor-icons/react";
import { useAuth } from "../context/AuthContext";

interface SeasonEntry {
  rank: number;
  teamName: string;
  abbreviation: string;
  logoUrl: string | null;
  teamId: string;
  seasonYear: number;
  value: number;
  wins?: number;
  losses?: number;
  ties?: number;
  isChampion: boolean;
  isLastPlace: boolean;
  managerName?: string | null;
  managerId?: string | null;
}

interface MatchupEntry {
  rank: number;
  teamName: string;
  abbreviation: string;
  logoUrl: string | null;
  teamId: string;
  opponentName: string;
  opponentAbbreviation: string;
  seasonYear: number;
  week: number;
  value: number;
  score?: string;
  isChampion: boolean;
  isLastPlace: boolean;
  managerName?: string | null;
  managerId?: string | null;
}

interface AllTimeRecord {
  userId: string;
  firstName: string;
  lastName: string;
  wins: number;
  losses: number;
  ties: number;
  seasonsPlayed: number;
  championships: number;
  lastPlaceFinishes: number;
  totalPointsFor: number;
  totalPointsAgainst: number;
}

interface TeamHistoryEntry {
  teamId: string;
  teamName: string;
  abbreviation: string;
  logoUrl: string | null;
  seasonYear: number;
  userId: string | null;
  firstName: string | null;
  lastName: string | null;
}

interface IndividualRecord {
  rank: number;
  playerName: string;
  nflTeam: string;
  points: number;
  week: number;
  teamId: string;
  teamName: string;
  teamAbbreviation: string;
  teamLogoUrl: string | null;
  seasonYear: number;
  isChampion: boolean;
  isLastPlace: boolean;
  managerName: string | null;
  managerId: string | null;
  opponentName: string | null;
}

interface HallOfFameData {
  seasonRecords: {
    mostPointsFor: SeasonEntry[];
    fewestPointsFor: SeasonEntry[];
    mostPointsAgainst: SeasonEntry[];
    fewestPointsAgainst: SeasonEntry[];
    highestDifferential: SeasonEntry[];
    lowestDifferential: SeasonEntry[];
    mostWins: SeasonEntry[];
    fewestWins: SeasonEntry[];
  };
  matchupRecords: {
    highestGameScore: MatchupEntry[];
    lowestGameScore: MatchupEntry[];
    biggestBlowout: MatchupEntry[];
    closestGame: MatchupEntry[];
    ties: MatchupEntry[];
  };
  allTimeRecords: AllTimeRecord[];
  champions: TeamHistoryEntry[];
  lastPlaceTeams: TeamHistoryEntry[];
  individualRecords: {
    QB: IndividualRecord[];
    RB: IndividualRecord[];
    WR: IndividualRecord[];
    TE: IndividualRecord[];
    K: IndividualRecord[];
  };
}

type CategoryKey =
  | "allTimeRecord"
  | "totalPointsFor"
  | "totalPointsAgainst"
  | "championshipCircle"
  | "losersLane"
  | "mostPointsFor"
  | "fewestPointsFor"
  | "mostPointsAgainst"
  | "fewestPointsAgainst"
  | "highestDifferential"
  | "lowestDifferential"
  | "mostWins"
  | "fewestWins"
  | "highestGameScore"
  | "lowestGameScore"
  | "biggestBlowout"
  | "closestGame"
  | "ties"
  | "indQB"
  | "indRB"
  | "indWR"
  | "indTE"
  | "indK";

interface CategoryDef {
  key: CategoryKey;
  label: string;
  group: "alltime" | "season" | "matchup" | "individual";
  valueLabel?: string;
  formatValue?: (entry: SeasonEntry | MatchupEntry) => string;
  position?: keyof HallOfFameData["individualRecords"];
}

const categories: CategoryDef[] = [
  { key: "allTimeRecord", label: "All-Time Record", group: "alltime" },
  { key: "totalPointsFor", label: "Total Points For", group: "alltime" },
  { key: "totalPointsAgainst", label: "Total Points Against", group: "alltime" },
  { key: "championshipCircle", label: "Championship Circle", group: "alltime" },
  { key: "losersLane", label: "Last Place", group: "alltime" },
  {
    key: "mostPointsFor",
    label: "Most Points For (Season)",
    group: "season",
    valueLabel: "Points For",
    formatValue: (e) => e.value.toFixed(1),
  },
  {
    key: "fewestPointsFor",
    label: "Fewest Points For (Season)",
    group: "season",
    valueLabel: "Points For",
    formatValue: (e) => e.value.toFixed(1),
  },
  {
    key: "mostPointsAgainst",
    label: "Most Points Against (Season)",
    group: "season",
    valueLabel: "Points Against",
    formatValue: (e) => e.value.toFixed(1),
  },
  {
    key: "fewestPointsAgainst",
    label: "Fewest Points Against (Season)",
    group: "season",
    valueLabel: "Points Against",
    formatValue: (e) => e.value.toFixed(1),
  },
  {
    key: "mostWins",
    label: "Most Wins (Season)",
    group: "season",
    valueLabel: "Record",
    formatValue: (e) => {
      const s = e as SeasonEntry;
      return s.ties ? `${s.wins}-${s.losses}-${s.ties}` : `${s.wins}-${s.losses}`;
    },
  },
  {
    key: "fewestWins",
    label: "Fewest Wins (Season)",
    group: "season",
    valueLabel: "Record",
    formatValue: (e) => {
      const s = e as SeasonEntry;
      return s.ties ? `${s.wins}-${s.losses}-${s.ties}` : `${s.wins}-${s.losses}`;
    },
  },
  {
    key: "highestDifferential",
    label: "Best Differential (Season)",
    group: "season",
    valueLabel: "Diff",
    formatValue: (e) => {
      const v = e.value;
      return v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1);
    },
  },
  {
    key: "lowestDifferential",
    label: "Worst Differential (Season)",
    group: "season",
    valueLabel: "Diff",
    formatValue: (e) => {
      const v = e.value;
      return v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1);
    },
  },
  {
    key: "highestGameScore",
    label: "Highest Game Score",
    group: "matchup",
    valueLabel: "Score",
    formatValue: (e) => e.value.toFixed(2),
  },
  {
    key: "lowestGameScore",
    label: "Lowest Game Score",
    group: "matchup",
    valueLabel: "Score",
    formatValue: (e) => e.value.toFixed(2),
  },
  {
    key: "biggestBlowout",
    label: "Biggest Blowout",
    group: "matchup",
    valueLabel: "Margin",
    formatValue: (e) => e.value.toFixed(2),
  },
  {
    key: "closestGame",
    label: "Closest Game",
    group: "matchup",
    valueLabel: "Margin",
    formatValue: (e) => e.value.toFixed(2),
  },
  {
    key: "ties",
    label: "Ties",
    group: "matchup",
    valueLabel: "Score",
    formatValue: (e) => e.value.toFixed(2),
  },
  { key: "indQB", label: "QB", group: "individual", position: "QB" },
  { key: "indRB", label: "RB", group: "individual", position: "RB" },
  { key: "indWR", label: "WR", group: "individual", position: "WR" },
  { key: "indTE", label: "TE", group: "individual", position: "TE" },
  { key: "indK", label: "K", group: "individual", position: "K" },
];

function getEntries(data: HallOfFameData, key: CategoryKey): (SeasonEntry | MatchupEntry)[] {
  if (key in data.seasonRecords) {
    return data.seasonRecords[key as keyof typeof data.seasonRecords];
  }
  return data.matchupRecords[key as keyof typeof data.matchupRecords];
}

function isMatchupEntry(entry: SeasonEntry | MatchupEntry): entry is MatchupEntry {
  return "week" in entry;
}

type AllTimeSortKey = "wins" | "winPct";

function winPct(r: AllTimeRecord): number {
  const total = r.wins + r.losses + r.ties;
  return total === 0 ? 0 : r.wins / total;
}

export function HallOfFamePage() {
  const { user } = useAuth();
  const [data, setData] = useState<HallOfFameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<CategoryKey>("allTimeRecord");
  const [expanded, setExpanded] = useState(false);
  const [allTimeSort, setAllTimeSort] = useState<AllTimeSortKey>("wins");

  useEffect(() => {
    fetch("/api/espn/hall-of-fame")
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(() => setError("Failed to load Hall of Fame data"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen">Loading…</div>;
  if (error || !data) {
    return (
      <div className="page">
        <div className="empty-state">
          <p className="empty-title">Could not load data</p>
          <p className="empty-sub">{error}</p>
        </div>
      </div>
    );
  }

  const activeCat = categories.find((c) => c.key === activeTab)!;
  const isAllTime = activeCat.group === "alltime";
  const isIndividual = activeCat.group === "individual";
  const entries = isAllTime || isIndividual ? [] : getEntries(data, activeTab);
  const visible = expanded ? entries : entries.slice(0, 10);
  const isMatchup = !isAllTime && !isIndividual && activeCat.group === "matchup";

  const individualEntries: IndividualRecord[] =
    isIndividual && activeCat.position
      ? data.individualRecords[activeCat.position]
      : [];
  const visibleIndividual = expanded ? individualEntries : individualEntries.slice(0, 10);

  function switchTab(key: CategoryKey) {
    setActiveTab(key);
    setExpanded(false);
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Hall of Fame</h1>
        <span className="page-meta">All-time leaderboards across every season</span>
      </div>

      <div className="hof-tabs">
        <div className="hof-tab-group">
          <span className="hof-tab-group-label">All Time Records</span>
          <div className="hof-tab-row">
            {categories
              .filter((c) => c.group === "alltime")
              .map((c) => (
                <button
                  key={c.key}
                  className={`week-tab${activeTab === c.key ? " active" : ""}`}
                  onClick={() => switchTab(c.key)}
                >
                  {c.label}
                </button>
              ))}
          </div>
        </div>
        <div className="hof-tab-group">
          <span className="hof-tab-group-label">Season Records</span>
          <div className="hof-tab-row">
            {categories
              .filter((c) => c.group === "season")
              .map((c) => (
                <button
                  key={c.key}
                  className={`week-tab${activeTab === c.key ? " active" : ""}`}
                  onClick={() => switchTab(c.key)}
                >
                  {c.label}
                </button>
              ))}
          </div>
        </div>
        <div className="hof-tab-group">
          <span className="hof-tab-group-label">Matchup Records</span>
          <div className="hof-tab-row">
            {categories
              .filter((c) => c.group === "matchup")
              .map((c) => (
                <button
                  key={c.key}
                  className={`week-tab${activeTab === c.key ? " active" : ""}`}
                  onClick={() => switchTab(c.key)}
                >
                  {c.label}
                </button>
              ))}
          </div>
        </div>
        <div className="hof-tab-group">
          <span className="hof-tab-group-label">Individual Records</span>
          <div className="hof-tab-row">
            {categories
              .filter((c) => c.group === "individual")
              .map((c) => (
                <button
                  key={c.key}
                  className={`week-tab${activeTab === c.key ? " active" : ""}`}
                  onClick={() => switchTab(c.key)}
                >
                  {c.label}
                </button>
              ))}
          </div>
        </div>
      </div>

      <section className="section">
        {/* ── All-Time Record ── */}
        {activeTab === "allTimeRecord" && (
          <>
            <div className="section-header-row">
              <h2>All-Time Record</h2>
              <div className="hof-sort-toggle">
                <button
                  className={`week-tab${allTimeSort === "wins" ? " active" : ""}`}
                  onClick={() => setAllTimeSort("wins")}
                >
                  Total Wins
                </button>
                <button
                  className={`week-tab${allTimeSort === "winPct" ? " active" : ""}`}
                  onClick={() => setAllTimeSort("winPct")}
                >
                  Win %
                </button>
              </div>
            </div>
            <div className="card table-card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="col-rank">#</th>
                    <th>Manager</th>
                    <th className="col-right">Seasons</th>
                    <th className="col-right">W–L–T</th>
                    <th className="col-right">Win %</th>
                    <th className="col-right">
                      <Trophy weight="duotone" size={14} />
                    </th>
                    <th className="col-right">
                      <AnchorSimple weight="bold" size={13} />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...data.allTimeRecords]
                    .sort((a, b) =>
                      allTimeSort === "wins"
                        ? b.wins - a.wins || winPct(b) - winPct(a)
                        : winPct(b) - winPct(a) || b.wins - a.wins
                    )
                    .map((r, i) => (
                      <tr key={r.userId} className={user?.id === r.userId ? "my-team-row" : ""}>
                        <td data-label="#" className="col-rank muted">{i + 1}</td>
                        <td data-label="Manager">
                          <span className="team-name-row">
                          <Link to={`/members/${r.userId}`} className="team-link-plain">
                            {r.firstName} {r.lastName}
                          </Link>
                          {user?.id === r.userId && (
                            <span className="my-team-badge">
                              <UserCircle weight="duotone" size={18} />
                            </span>
                          )}
                          </span>
                        </td>
                        <td data-label="Seasons" className="col-right muted">{r.seasonsPlayed}</td>
                        <td data-label="W–L–T" className="col-right">
                          {r.ties ? `${r.wins}–${r.losses}–${r.ties}` : `${r.wins}–${r.losses}`}
                        </td>
                        <td data-label="Win %" className="col-right">{(winPct(r) * 100).toFixed(1)}%</td>
                        <td data-label="Titles" className="col-right">
                          {r.championships > 0 ? (
                            <span className="champion-badge">{r.championships}</span>
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </td>
                        <td data-label="Last" className="col-right">
                          {r.lastPlaceFinishes > 0 ? (
                            <span className="last-place-badge">{r.lastPlaceFinishes}</span>
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── Total Points For ── */}
        {activeTab === "totalPointsFor" && (
          <>
            <h2>Total Points For</h2>
            <div className="card table-card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="col-rank">#</th>
                    <th>Manager</th>
                    <th className="col-right">Seasons</th>
                    <th className="col-right">Total PF</th>
                    <th className="col-right">Avg PF/Season</th>
                  </tr>
                </thead>
                <tbody>
                  {[...data.allTimeRecords]
                    .sort((a, b) => b.totalPointsFor - a.totalPointsFor)
                    .map((r, i) => (
                      <tr key={r.userId} className={user?.id === r.userId ? "my-team-row" : ""}>
                        <td data-label="#" className="col-rank muted">{i + 1}</td>
                        <td data-label="Manager">
                          <span className="team-name-row">
                            <Link to={`/members/${r.userId}`} className="team-link-plain">
                              {r.firstName} {r.lastName}
                            </Link>
                            {user?.id === r.userId && (
                              <span className="my-team-badge">
                                <UserCircle weight="duotone" size={18} />
                              </span>
                            )}
                          </span>
                        </td>
                        <td data-label="Seasons" className="col-right muted">{r.seasonsPlayed}</td>
                        <td data-label="Total PF" className="col-right">{r.totalPointsFor.toFixed(1)}</td>
                        <td data-label="Avg PF/Season" className="col-right muted">
                          {(r.totalPointsFor / r.seasonsPlayed).toFixed(1)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── Total Points Against ── */}
        {activeTab === "totalPointsAgainst" && (
          <>
            <h2>Total Points Against</h2>
            <div className="card table-card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="col-rank">#</th>
                    <th>Manager</th>
                    <th className="col-right">Seasons</th>
                    <th className="col-right">Total PA</th>
                    <th className="col-right">Avg PA/Season</th>
                  </tr>
                </thead>
                <tbody>
                  {[...data.allTimeRecords]
                    .sort((a, b) => b.totalPointsAgainst - a.totalPointsAgainst)
                    .map((r, i) => (
                      <tr key={r.userId} className={user?.id === r.userId ? "my-team-row" : ""}>
                        <td data-label="#" className="col-rank muted">{i + 1}</td>
                        <td data-label="Manager">
                          <span className="team-name-row">
                            <Link to={`/members/${r.userId}`} className="team-link-plain">
                              {r.firstName} {r.lastName}
                            </Link>
                            {user?.id === r.userId && (
                              <span className="my-team-badge">
                                <UserCircle weight="duotone" size={18} />
                              </span>
                            )}
                          </span>
                        </td>
                        <td data-label="Seasons" className="col-right muted">{r.seasonsPlayed}</td>
                        <td data-label="Total PA" className="col-right">{r.totalPointsAgainst.toFixed(1)}</td>
                        <td data-label="Avg PA/Season" className="col-right muted">
                          {(r.totalPointsAgainst / r.seasonsPlayed).toFixed(1)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── Championship Circle ── */}
        {activeTab === "championshipCircle" && (
          <>
            <h2>Winner's Circle</h2>
            <div className="card table-card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Season</th>
                    <th>Champion</th>
                  </tr>
                </thead>
                <tbody>
                  {data.champions.map((c) => (
                    <tr key={c.seasonYear} className="champion-row">
                      <td data-label="Season">
                        <Link to={`/seasons/${c.seasonYear}`} className="team-link-plain">
                          {c.seasonYear}
                        </Link>
                      </td>
                      <td data-label="Champion">
                        <span className="team-name-row">
                          <Link
                            to={`/seasons/${c.seasonYear}/teams/${c.teamId}`}
                            className="team-link"
                          >
                            {c.logoUrl && <img src={c.logoUrl} alt="" className="team-logo-sm" />}
                            <span>{c.teamName}</span>
                          </Link>
                          <span className="champion-badge">
                            <Trophy weight="duotone" size={18} />
                          </span>
                          {user?.id === c.userId && (
                            <span className="my-team-badge">
                              <UserCircle weight="duotone" size={18} />
                            </span>
                          )}
                        </span>
                        {c.firstName && c.lastName && (
                          <div className="hof-manager">
                            {c.userId ? (
                              <Link to={`/members/${c.userId}`} className="team-link-plain">
                                {c.firstName} {c.lastName}
                              </Link>
                            ) : (
                              `${c.firstName} ${c.lastName}`
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── Last Place ── */}
        {activeTab === "losersLane" && (
          <>
            <h2>Last Place</h2>
            <div className="card table-card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Season</th>
                    <th>Last Place</th>
                  </tr>
                </thead>
                <tbody>
                  {data.lastPlaceTeams.map((c) => (
                    <tr key={c.seasonYear} className="last-place-row">
                      <td data-label="Season">
                        <Link to={`/seasons/${c.seasonYear}`} className="team-link-plain">
                          {c.seasonYear}
                        </Link>
                      </td>
                      <td data-label="Last Place">
                        <span className="team-name-row">
                          <Link
                            to={`/seasons/${c.seasonYear}/teams/${c.teamId}`}
                            className="team-link"
                          >
                            {c.logoUrl && <img src={c.logoUrl} alt="" className="team-logo-sm" />}
                            <span>{c.teamName}</span>
                          </Link>
                          <span className="last-place-badge">
                            <AnchorSimple weight="bold" size={16} />
                          </span>
                          {user?.id === c.userId && (
                            <span className="my-team-badge">
                              <UserCircle weight="duotone" size={18} />
                            </span>
                          )}
                        </span>
                        {c.firstName && c.lastName && (
                          <div className="hof-manager">
                            {c.userId ? (
                              <Link to={`/members/${c.userId}`} className="team-link-plain">
                                {c.firstName} {c.lastName}
                              </Link>
                            ) : (
                              `${c.firstName} ${c.lastName}`
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── Season / Matchup leaderboard ── */}
        {!isAllTime && !isIndividual && (
          <>
            <h2>{activeCat.label}</h2>
            <div className="card table-card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="col-rank">#</th>
                    <th>Team</th>
                    <th>Season</th>
                    {isMatchup && <th>Week</th>}
                    {isMatchup && <th>Opponent</th>}
                    <th className="col-right">{activeCat.valueLabel}</th>
                    {(activeTab === "biggestBlowout" || activeTab === "closestGame") && (
                      <th className="col-right">Score</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {visible.map((entry) => (
                    <tr key={`${entry.teamId}-${entry.seasonYear}-${entry.rank}`} className={user?.id === entry.managerId ? "my-team-row" : ""}>
                      <td data-label="#" className="col-rank muted">{entry.rank}</td>
                      <td data-label="Team">
                        <span className="team-name-row">
                          <Link
                            to={`/seasons/${entry.seasonYear}/teams/${entry.teamId}`}
                            className="team-link"
                          >
                            {entry.logoUrl && (
                              <img src={entry.logoUrl} alt="" className="team-logo-sm" />
                            )}
                            <span>{entry.teamName}</span>
                          </Link>
                          {entry.isChampion && (
                            <span className="champion-badge">
                              <Trophy weight="duotone" size={18} />
                            </span>
                          )}
                          {entry.isLastPlace && (
                            <span className="last-place-badge">
                              <AnchorSimple weight="bold" size={16} />
                            </span>
                          )}
                          {user?.id === entry.managerId && (
                            <span className="my-team-badge">
                              <UserCircle weight="duotone" size={18} />
                            </span>
                          )}
                        </span>
                        {entry.managerName && (
                          <div className="hof-manager">
                            {entry.managerId ? (
                              <Link to={`/members/${entry.managerId}`} className="team-link-plain">
                                {entry.managerName}
                              </Link>
                            ) : (
                              entry.managerName
                            )}
                          </div>
                        )}
                      </td>
                      <td data-label="Season">
                        <Link to={`/seasons/${entry.seasonYear}`} className="team-link-plain">
                          {entry.seasonYear}
                        </Link>
                      </td>
                      {isMatchup && <td data-label="Week">{(entry as MatchupEntry).week}</td>}
                      {isMatchup && (
                        <td data-label="Opponent" className="muted">{(entry as MatchupEntry).opponentName}</td>
                      )}
                      <td data-label={activeCat.valueLabel} className="col-right">{activeCat.formatValue!(entry)}</td>
                      {(activeTab === "biggestBlowout" || activeTab === "closestGame") &&
                        isMatchupEntry(entry) && (
                          <td data-label="Score" className="col-right muted">{entry.score}</td>
                        )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {entries.length > 10 && (
              <button className="hof-expand-btn" onClick={() => setExpanded(!expanded)}>
                {expanded ? "Show Top 10" : `Show all ${entries.length}`}
              </button>
            )}
          </>
        )}

        {/* ── Individual Records ── */}
        {isIndividual && (
          <>
            <h2>Top {activeCat.label} Performances</h2>
            <div className="card table-card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="col-rank">#</th>
                    <th>Player</th>
                    <th className="col-right">Points</th>
                    <th>Fantasy Team</th>
                    <th>Opponent</th>
                    <th>Season</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleIndividual.map((entry) => (
                    <tr key={`${entry.rank}-${entry.teamId}-${entry.seasonYear}-${entry.week}`}>
                      <td data-label="#" className="col-rank muted">{entry.rank}</td>
                      <td data-label="Player">
                        <span>{entry.playerName}</span>
                        <div className="hof-manager">{entry.nflTeam}</div>
                      </td>
                      <td data-label="Points" className="col-right">{entry.points.toFixed(2)}</td>
                      <td data-label="Fantasy Team">
                        <span className="team-name-row">
                          <Link
                            to={`/seasons/${entry.seasonYear}/teams/${entry.teamId}`}
                            className="team-link"
                          >
                            {entry.teamLogoUrl && (
                              <img src={entry.teamLogoUrl} alt="" className="team-logo-sm" />
                            )}
                            <span>{entry.teamName}</span>
                          </Link>
                          {entry.isChampion && (
                            <span className="champion-badge">
                              <Trophy weight="duotone" size={18} />
                            </span>
                          )}
                          {entry.isLastPlace && (
                            <span className="last-place-badge">
                              <AnchorSimple weight="bold" size={16} />
                            </span>
                          )}
                        </span>
                        {entry.managerName && (
                          <div className="hof-manager">
                            {entry.managerId ? (
                              <Link to={`/members/${entry.managerId}`} className="team-link-plain">
                                {entry.managerName}
                              </Link>
                            ) : (
                              entry.managerName
                            )}
                          </div>
                        )}
                      </td>
                      <td data-label="Opponent" className="muted">
                        {entry.opponentName ?? "—"}
                      </td>
                      <td data-label="Season">
                        <Link to={`/seasons/${entry.seasonYear}`} className="team-link-plain">
                          {entry.seasonYear}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {individualEntries.length > 10 && (
              <button className="hof-expand-btn" onClick={() => setExpanded(!expanded)}>
                {expanded ? "Show Top 10" : `Show all ${individualEntries.length}`}
              </button>
            )}
          </>
        )}
      </section>
    </div>
  );
}
