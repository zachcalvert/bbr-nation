/**
 * prisma/seed.ts
 *
 * Creates one User per league member. Run with:
 *   npm run db:seed
 *
 * This script is idempotent (safe to re-run). Passwords are only set on
 * first creation — re-running will NOT overwrite a user's password.
 *
 * IMPORTANT: espnId must match the team's numeric ID in ESPN (Team.id from
 * the espn-fantasy-football-api package). This is what links each user to
 * their fantasy team data during the ESPN sync.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

interface LeagueMember {
  email: string;
  password: string; // default password; user should change after first login
  firstName: string;
  lastName: string;
  espnId: string; // ESPN fantasy team ID (integer, as string)
  groupmeId: string; // GroupMe member ID
  favoriteTeam: string; // favorite NFL team
}

// ─────────────────────────────────────────────────────────────────────────────
// Fill in one entry per league member below.
// espnId = the integer Team.id from the ESPN API for that member's franchise.
// ─────────────────────────────────────────────────────────────────────────────
const LEAGUE_MEMBERS: LeagueMember[] = [
  {
    email: "daniel@example.com",
    password: "Henley65!",
    firstName: "Daniel",
    lastName: "Calero",
    espnId: "1", // replace with your ESPN team ID
    groupmeId: "30837252", // replace with your GroupMe ID
    favoriteTeam: "Lions", // replace with your favorite NFL team
  },
  {
    email: "thumbs@example.com",
    password: "Henley65!",
    firstName: "Justin",
    lastName: "Shaw",
    espnId: "2", // replace with your ESPN team ID
    groupmeId: "87582812", // replace with your GroupMe ID
    favoriteTeam: "Vikings", // replace with your favorite NFL team
  },
  {
    email: "zacharym.calvert@gmail.com",
    password: "Henley65!",
    firstName: "Zach",
    lastName: "Calvert",
    espnId: "3", // replace with your ESPN team ID
    groupmeId: "30803449", // replace with your GroupMe ID
    favoriteTeam: "Lions", // replace with your favorite NFL team
  },
  {
    email: "shanechandler24@example.com",
    password: "Henley65!",
    firstName: "Shane",
    lastName: "Chandler",
    espnId: "4",
    groupmeId: "22026356",
    favoriteTeam: "Falcons",
  },
  {
    email: "fish@example.com",
    password: "Henley65!",
    firstName: "Fish",
    lastName: "Petrossian",
    espnId: "5", // replace with your ESPN team ID
    groupmeId: "4689709", // replace with your GroupMe ID
    favoriteTeam: "Steelers", // replace with your favorite NFL team
  },
  {
    email: "rock@example.com",
    password: "Henley65!",
    firstName: "Jerad",
    lastName: "Wehrle",
    espnId: "6", // replace with your ESPN team ID
    groupmeId: "30837253", // replace with your GroupMe ID
    favoriteTeam: "Bears", // replace with your favorite NFL team
  },
  {
    email: "rene@example.com",
    password: "Henley65!",
    firstName: "Rene",
    lastName: "Kaza",
    espnId: "7", // replace with your ESPN team ID
    groupmeId: "30833338", // replace with your GroupMe ID
    favoriteTeam: "Eagles", // replace with your favorite NFL team
  },
  {
    email: "tim@example.com",
    password: "Henley65!",
    firstName: "Tim",
    lastName: "Eldgredge",
    espnId: "8", // replace with your ESPN team ID
    groupmeId: "49957566", // replace with your GroupMe ID
    favoriteTeam: "Falcons", // replace with your favorite NFL team
  },
  {
    email: "bk@example.com",
    password: "Henley65!",
    firstName: "Bryan",
    lastName: "Kim",
    espnId: "9", // replace with your ESPN team ID
    groupmeId: "30837255", // replace with your GroupMe ID
    favoriteTeam: "49ers", // replace with your favorite NFL team
  },
  {
    email: "trav@example.com",
    password: "Henley65!",
    firstName: "Travis",
    lastName: "Mann",
    espnId: "10", // replace with your ESPN team ID
    groupmeId: "4037223", // replace with your GroupMe ID
    favoriteTeam: "49ers", // replace with your favorite NFL team
  },
];

async function main() {
  console.log(`Seeding ${LEAGUE_MEMBERS.length} league member(s)...`);

  for (const member of LEAGUE_MEMBERS) {
    const existing = await prisma.user.findUnique({
      where: { espnId: member.espnId },
    });

    if (existing) {
      // Update profile fields but never touch the password
      await prisma.user.update({
        where: { espnId: member.espnId },
        data: {
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email,
          groupmeId: member.groupmeId,
          favoriteTeam: member.favoriteTeam,
        },
      });
      console.log(`  Updated: ${member.firstName} ${member.lastName} (espnId=${member.espnId})`);
    } else {
      const hashed = await bcrypt.hash(member.password, 10);
      await prisma.user.create({
        data: {
          email: member.email,
          password: hashed,
          firstName: member.firstName,
          lastName: member.lastName,
          espnId: member.espnId,
          groupmeId: member.groupmeId,
          favoriteTeam: member.favoriteTeam,
        },
      });
      console.log(`  Created: ${member.firstName} ${member.lastName} (espnId=${member.espnId})`);
    }
  }

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
