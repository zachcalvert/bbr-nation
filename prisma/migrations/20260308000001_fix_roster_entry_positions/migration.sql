-- Fix position values in espn_roster_entries.
--
-- The espn-fantasy-football-api library maps both defaultPositionId and
-- eligibleSlots through the same slotCategoryIdToPositionMap, but ESPN uses
-- different numbering for player position IDs vs slot category IDs.
-- This caused WRs to be stored as 'RB/WR', TEs as 'WR/TE' or 'WR',
-- QBs as 'TQB', and Ks as 'WR/TE'.

-- Step 1: For entries in a standard lineup slot, the slot directly tells us
-- the player's position. This is the most reliable source of truth.
UPDATE espn_roster_entries
SET position = lineup_slot
WHERE lineup_slot IN ('QB', 'RB', 'WR', 'TE', 'K', 'D/ST')
  AND position != lineup_slot;

-- Step 2: Fix remaining entries (flex, bench, IR) using known mappings
-- from the library's broken position output.

-- 'RB/WR' = WR (posId 3 -> slot 3 -> "RB/WR", actual position: WR)
UPDATE espn_roster_entries SET position = 'WR' WHERE position = 'RB/WR';

-- 'TQB' = QB (posId 1 -> slot 1 -> "TQB", actual position: QB)
UPDATE espn_roster_entries SET position = 'QB' WHERE position = 'TQB';

-- 'WR' in non-standard slots = TE (posId 4 -> slot 4 -> "WR", actual: TE)
-- Standard-slot entries already corrected in Step 1, so only flex/bench/IR remain.
UPDATE espn_roster_entries SET position = 'TE'
WHERE position = 'WR'
  AND lineup_slot NOT IN ('QB', 'RB', 'WR', 'TE', 'K', 'D/ST');

-- 'WR/TE' = TE (pre-fix: eligibleSlots[0] for TEs; post-fix Ks already
-- corrected in Step 1 via lineup_slot='K')
UPDATE espn_roster_entries SET position = 'TE' WHERE position = 'WR/TE';

-- 'Rookie' entries in standard slots were already fixed in Step 1.
-- Remaining 'Rookie' entries (bench/IR/flex) are left as-is since they're
-- excluded from record queries and we can't reliably determine their position.
