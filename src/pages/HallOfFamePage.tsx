import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trophy, AnchorSimple } from "@phosphor-icons/react";

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

interface HallOfFameData {
  seasonRecords: {
    mostPointsFor: SeasonEntry[];
    fewestPointsFor: SeasonEntry[];
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
  };
  allTimeRecords: AllTimeRecord[];
  champions: TeamHistoryEntry[];
  lastPlaceTeams: TeamHistoryEntry[];
}

type CategoryKey =
  | "allTimeRecord"
  | "championshipCircle"
  | "losersLane"
  | "mostPointsFor"
  | "fewestPointsFor"
  | "highestDifferential"
  | "lowestDifferential"
  | "mostWins"
  | "fewestWins"
  | "highestGameScore"
  | "lowestGameScore"
  | "biggestBlowout"
  | "closestGame";

interface CategoryDef {
  key: CategoryKey;
  label: string;
  group: "alltime" | "season" | "matchup";
  valueLabel?: string;
  formatValue?: (entry: SeasonEntry | MatchupEntry) => string;
}

const categories: CategoryDef[] = [
  { key: "allTimeRecord", label: "All-Time Record", group: "alltime" },
  { key: "championshipCircle", label: "Championship Circle", group: "alltime" },
  { key: "losersLane", label: "Last Place Larrys", group: "alltime" },
  {
    key: "mostPointsFor",
    label: "Most Points (Season)",
    group: "season",
    valueLabel: "Points For",
    formatValue: (e) => e.value.toFixed(1),
  },
  {
    key: "fewestPointsFor",
    label: "Fewest Points (Season)",
    group: "season",
    valueLabel: "Points For",
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
  const entries = isAllTime ? [] : getEntries(data, activeTab);
  const visible = expanded ? entries : entries.slice(0, 10);
  const isMatchup = !isAllTime && activeCat.group === "matchup";

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
                      <tr key={r.userId}>
                        <td data-label="#" className="col-rank muted">{i + 1}</td>
                        <td data-label="Manager">
                          <Link to={`/members/${r.userId}`} className="team-link-plain">
                            {r.firstName} {r.lastName}
                          </Link>
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

        {/* ── Championship Circle ── */}
        {activeTab === "championshipCircle" && (
          <>
            <h2>Championship Circle</h2>
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

        {/* ── Last Place Larrys ── */}
        {activeTab === "losersLane" && (
          <>
            <h2>Last Place Larrys</h2>
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
        {!isAllTime && (
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
                    <tr key={`${entry.teamId}-${entry.seasonYear}-${entry.rank}`}>
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
      </section>
    </div>
  );
}
