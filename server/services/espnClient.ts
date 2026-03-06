import { createRequire } from "node:module";
import type { Client as EspnClientType, ClientOptions } from "espn-fantasy-football-api/node";

// The espn-fantasy-football-api package ships CJS-only bundles, so we use
// createRequire to load it from this ESM project.
const require = createRequire(import.meta.url);
const { Client } = require("espn-fantasy-football-api/node") as {
  Client: new (options: ClientOptions) => EspnClientType;
};

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const espnClient: EspnClientType = new Client({
  leagueId: Number(getRequiredEnv("ESPN_LEAGUE_ID")),
  espnS2: getRequiredEnv("ESPN_S2"),
  SWID: getRequiredEnv("ESPN_SWID"),
});

export const ESPN_LEAGUE_START_YEAR = Number(
  getRequiredEnv("ESPN_LEAGUE_START_YEAR")
);
