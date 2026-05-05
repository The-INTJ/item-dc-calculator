import type { ContestConfig, ScoreBreakdown } from '../../contexts/contest/contestTypes';

export interface AutoVoteEntry {
  entryId: string;
  breakdown: ScoreBreakdown;
}

/**
 * Builds midpoint scores for entries the user hasn't scored.
 * Used to ensure partial voting still counts — if a user scores
 * only one entry in a matchup, the other gets a neutral midpoint score.
 */
export function buildAutoVoteScores(
  allEntryIds: string[],
  scoredEntryIds: string[],
  config: ContestConfig,
): AutoVoteEntry[] {
  const scored = new Set(scoredEntryIds);
  const unscored = allEntryIds.filter((id) => !scored.has(id));

  if (unscored.length === 0) return [];

  const breakdown: ScoreBreakdown = {};
  for (const attr of config.attributes) {
    const min = attr.min ?? 0;
    const max = attr.max ?? 10;
    breakdown[attr.id] = (min + max) / 2;
  }

  return unscored.map((entryId) => ({ entryId, breakdown: { ...breakdown } }));
}

/**
 * Builds a max-score self-vote for a contestant on their own entry.
 * The VoteModal UI promises self-entries auto-record the maximum; this
 * keeps the aggregate honest (e.g. with 2 contestants both scoring each
 * other 5/10, each entry ends up averaging 7.5 once their own self-max
 * is included).
 */
export function buildSelfMaxVote(
  selfEntryId: string | null,
  config: ContestConfig,
): AutoVoteEntry[] {
  if (!selfEntryId) return [];
  const breakdown: ScoreBreakdown = {};
  for (const attr of config.attributes) {
    breakdown[attr.id] = attr.max ?? 10;
  }
  return [{ entryId: selfEntryId, breakdown }];
}
