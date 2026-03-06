# Plan: User Model & League Membership

**Status:** Not started

## Overview
Expand the existing User model to include all fields needed for a fantasy league member. Every user on the site is a league member — the user list is effectively the league roster.

## Schema Changes
Add to the existing `User` model in `prisma/schema.prisma`:

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String

  firstName    String   @map("first_name")
  lastName     String   @map("last_name")
  espnId       String   @unique @map("espn_id")
  groupmeId    String   @unique @map("groupme_id")
  favoriteTeam String   @map("favorite_team")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("users")
}
```

## Key Decisions (TBD)
- Should `favoriteTeam` be a free-text string or an enum of NFL teams?
- Registration flow — do users self-register, or are accounts pre-seeded by an admin?
- Profile editing — can users update their own info?
- Avatar / display name beyond first + last?

## Rough Scope
- [ ] Prisma schema migration with new fields
- [ ] Update registration/auth flow to collect new fields
- [ ] API endpoint for fetching user profiles
- [ ] API endpoint for updating user profile
- [ ] Admin seeding script (if pre-seeding users)
- [ ] Frontend profile page / settings

## Existing Foundation
- `User` model exists with `id`, `email`, `password`, `createdAt`, `updatedAt`
- Auth routes handle register/login/logout
- `server/routes/users.ts` exists for user-related endpoints

## Notes
- `espnId` links to the ESPN Fantasy Football API data.
- `groupmeId` links to the external bot/messaging service.
- Since membership is fixed to the league, consider whether open registration makes sense or if accounts should be invite-only / pre-created.
