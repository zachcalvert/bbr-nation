-- Corrective migration: the previous migration's SQL statements ran in the
-- wrong order, causing WRs in flex/bench/IR slots to be chained through
-- 'RB/WR' → 'WR' → 'TE'. Fix by cross-referencing each player's other weeks:
-- if a player ever appeared in lineup_slot='WR', they're a WR, not a TE.

UPDATE espn_roster_entries re
SET position = 'WR'
WHERE re.position = 'TE'
  AND re.lineup_slot NOT IN ('QB', 'RB', 'WR', 'TE', 'K', 'D/ST')
  AND EXISTS (
    SELECT 1 FROM espn_roster_entries other
    WHERE other.espn_player_id = re.espn_player_id
      AND other.lineup_slot = 'WR'
  );
