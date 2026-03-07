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
}

type CategoryKey =
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
  group: "season" | "matchup";
  valueLabel: string;
  formatValue: (entry: SeasonEntry | MatchupEntry) => string;
}

const categories: CategoryDef[] = [
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

export function HallOfFamePage() {
  const [data, setData] = useState<HallOfFameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<CategoryKey>("mostPointsFor");
  const [expanded, setExpanded] = useState(false);

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
  const entries = getEntries(data, activeTab);
  const visible = expanded ? entries : entries.slice(0, 10);
  const isMatchup = activeCat.group === "matchup";

  return (
    <div className="page">
      <div className="page-header">
        <h1>Hall of Fame</h1>
        <span className="page-meta">All-time leaderboards across every season</span>
      </div>

      <div className="hof-tabs">
        <div className="hof-tab-group">
          <span className="hof-tab-group-label">Season Records</span>
          <div className="hof-tab-row">
            {categories
              .filter((c) => c.group === "season")
              .map((c) => (
                <button
                  key={c.key}
                  className={`week-tab${activeTab === c.key ? " active" : ""}`}
                  onClick={() => {
                    setActiveTab(c.key);
                    setExpanded(false);
                  }}
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
                  onClick={() => {
                    setActiveTab(c.key);
                    setExpanded(false);
                  }}
                >
                  {c.label}
                </button>
              ))}
          </div>
        </div>
      </div>

      <section className="section">
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
                  <td className="col-rank muted">{entry.rank}</td>
                  <td>
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
                  <td>
                    <Link to={`/seasons/${entry.seasonYear}`} className="team-link-plain">
                      {entry.seasonYear}
                    </Link>
                  </td>
                  {isMatchup && <td>{(entry as MatchupEntry).week}</td>}
                  {isMatchup && <td className="muted">{(entry as MatchupEntry).opponentName}</td>}
                  <td className="col-right">{activeCat.formatValue(entry)}</td>
                  {(activeTab === "biggestBlowout" || activeTab === "closestGame") &&
                    isMatchupEntry(entry) && (
                      <td className="col-right muted">{entry.score}</td>
                    )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {entries.length > 10 && (
          <button
            className="hof-expand-btn"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Show Top 10" : `Show all ${entries.length}`}
          </button>
        )}
      </section>
    </div>
  );
}
