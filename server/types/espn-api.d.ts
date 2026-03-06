declare module "espn-fantasy-football-api/node" {
  // ── Player (base — also returned in Team.roster) ──────────────────────────
  export interface EspnPlayer {
    id: number;
    firstName: string;
    lastName: string;
    fullName: string;
    defaultPosition: string; // e.g. "QB"
    eligiblePositions: string[]; // e.g. ["QB", "OP"]
    proTeam: string | null; // full NFL team name, e.g. "Kansas City Chiefs"
    proTeamAbbreviation: string | null; // e.g. "KC"; null for free agents
    acquiredDate: Date | null; // null for drafted players never moved
    availabilityStatus: string;
    injuryStatus: string | null; // e.g. "QUESTIONABLE", "IR", null
    isInjured: boolean;
    jerseyNumber: string;
  }

  // ── BoxscorePlayer (extends Player — used in Boxscore rosters) ───────────
  export interface EspnBoxscorePlayer extends EspnPlayer {
    // Lineup slot this player occupied for the week:
    //   "QB", "RB", "WR", "TE", "FLEX", "D/ST", "K", "Bench", "IR"
    rosteredPosition: string;
    totalPoints: number;
  }

  // ── Team (returned by getTeamsAtWeek) ─────────────────────────────────────
  export interface EspnTeam {
    id: number;
    name: string;
    abbreviation: string;
    ownerName: string;
    logoURL: string | null;
    wavierRank: number | null; // note: upstream library typo ("wavier" not "waiver")
    roster: EspnPlayer[];
    wins: number;
    losses: number;
    ties: number;
    regularSeasonPointsFor: number;
    regularSeasonPointsAgainst: number;
    totalPointsScored: number;
    playoffSeed: number | null;
    finalStandingsPosition: number | null;
    divisionWins: number;
    divisionLosses: number;
    divisionTies: number;
  }

  // ── Boxscore (returned by getBoxscoreForWeek) ─────────────────────────────
  export interface EspnBoxscore {
    homeTeamId: number;
    awayTeamId: number;
    homeScore: number;
    awayScore: number;
    homeRoster: EspnBoxscorePlayer[];
    awayRoster: EspnBoxscorePlayer[];
  }

  // ── League settings ───────────────────────────────────────────────────────
  export interface EspnScheduleSettings {
    numberOfRegularSeasonMatchups: number; // regular season weeks
    numberOfPlayoffMatchups: number; // playoff weeks
    numberOfPlayoffTeams: number;
  }

  export interface EspnLeague {
    name: string;
    size: number;
    currentScoringPeriodId: number; // most recent completed scoring period
    scheduleSettings: EspnScheduleSettings;
  }

  // ── Client ────────────────────────────────────────────────────────────────
  export interface ClientOptions {
    leagueId: number;
    espnS2?: string;
    SWID?: string;
  }

  export class Client {
    constructor(options: ClientOptions);
    setCookies(cookies: { espnS2?: string; SWID?: string }): void;

    getLeagueInfo(params: { seasonId: number }): Promise<EspnLeague>;

    getTeamsAtWeek(params: {
      seasonId: number;
      scoringPeriodId: number;
    }): Promise<EspnTeam[]>;

    getBoxscoreForWeek(params: {
      seasonId: number;
      matchupPeriodId: number;
      scoringPeriodId: number;
    }): Promise<EspnBoxscore[]>;

    getHistoricalTeamsAtWeek(params: {
      seasonId: number;
      scoringPeriodId: number;
    }): Promise<EspnTeam[]>;

    getHistoricalScoreboardForWeek(params: {
      seasonId: number;
      matchupPeriodId: number;
      scoringPeriodId: number;
    }): Promise<EspnBoxscore[]>;
  }
}
