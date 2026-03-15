/**
 * prisma/seed.ts
 *
 * Creates example user accounts for local development. Run with:
 *   npm run db:seed
 *
 * This script is idempotent (safe to re-run). Passwords are only set on
 * first creation — re-running will NOT overwrite a user's password.
 *
 * Customize the LEAGUE_MEMBERS array below with your own league members.
 * After seeding, use the admin panel to link ESPN teams to each user.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

interface LeagueMember {
  email: string;
  password: string; // default password; user should change after first login
  firstName: string;
  lastName: string;
  groupmeId?: string; // optional external identifier (e.g. GroupMe member ID)
  favoriteTeam: string; // favorite NFL team
  isAdmin?: boolean; // whether this user has admin privileges
}

// ─────────────────────────────────────────────────────────────────────────────
// Fill in one entry per league member below.
// The first entry is an admin account you can use to manage the app.
// ─────────────────────────────────────────────────────────────────────────────
const LEAGUE_MEMBERS: LeagueMember[] = [
  {
    email: "admin@example.com",
    password: "beeber",
    firstName: "Admin",
    lastName: "User",
    favoriteTeam: "Lions",
    isAdmin: true,
  },
  {
    email: "member@example.com",
    password: "beeber",
    firstName: "League",
    lastName: "Member",
    favoriteTeam: "Bears",
  },
];

async function main() {
  console.log(`Seeding ${LEAGUE_MEMBERS.length} league member(s)...`);

  for (const member of LEAGUE_MEMBERS) {
    const existing = await prisma.user.findUnique({
      where: { email: member.email },
    });

    if (existing) {
      // Update profile fields but never touch the password
      await prisma.user.update({
        where: { email: member.email },
        data: {
          firstName: member.firstName,
          lastName: member.lastName,
          favoriteTeam: member.favoriteTeam,
          isAdmin: member.isAdmin ?? false,
          ...(member.groupmeId ? { groupmeId: member.groupmeId } : {}),
        },
      });
      console.log(`  Updated: ${member.firstName} ${member.lastName}`);
    } else {
      const hashed = await bcrypt.hash(member.password, 10);
      await prisma.user.create({
        data: {
          email: member.email,
          password: hashed,
          firstName: member.firstName,
          lastName: member.lastName,
          favoriteTeam: member.favoriteTeam,
          isAdmin: member.isAdmin ?? false,
          ...(member.groupmeId ? { groupmeId: member.groupmeId } : {}),
        },
      });
      console.log(`  Created: ${member.firstName} ${member.lastName}`);
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
