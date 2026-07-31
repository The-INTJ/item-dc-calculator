import { isBreakdownKey } from '../domain/scoreUtils';
import { buildAutoVoteScores, buildSelfMaxVote } from '../domain/autoVote';
import type { ContestConfig, ScoreBreakdown } from '../../contexts/contest/contestTypes';

type ScoreByEntryId = Record<string, Record<string, number>>;

export interface AssembledBallot {
  /** Entries the voter actually scored by hand (self entry excluded). */
  voteEntries: Array<{ entryId: string; breakdown: Partial<ScoreBreakdown> }>;
  autoVotes: Array<{ entryId: string; breakdown: Partial<ScoreBreakdown> }>;
  selfVote: Array<{ entryId: string; breakdown: Partial<ScoreBreakdown> }>;
  /** Manual + auto + self votes, in submission order. */
  allVotes: Array<{ entryId: string; breakdown: Partial<ScoreBreakdown> }>;
}

/**
 * Assembles a complete matchup ballot from raw slider state: keeps the voter's
 * manual scores (dropping their own entry), backfills unscored opponents via
 * the auto-vote policy, and appends the max-score self vote.
 */
export function assembleBallot(args: {
  scores: ScoreByEntryId;
  entryIds: string[];
  categoryIds: string[];
  selfEntryId: string | null;
  config: ContestConfig;
}): AssembledBallot {
  const { scores, entryIds, categoryIds, selfEntryId, config } = args;

  const voteEntries = Object.entries(scores)
    .filter(([entryId]) => entryId !== selfEntryId)
    .map(([entryId, entryScores]) => {
      const breakdown = categoryIds.reduce<Partial<ScoreBreakdown>>((acc, cid) => {
        if (!isBreakdownKey(cid, config)) return acc;
        const value = entryScores?.[cid];
        if (Number.isFinite(value)) acc[cid] = value;
        return acc;
      }, {});
      return { entryId, breakdown };
    })
    .filter((e) => Object.keys(e.breakdown).length > 0);

  const scoredIds = voteEntries.map((e) => e.entryId);
  const otherEntryIds = entryIds.filter((id) => id !== selfEntryId);
  const autoVotes = buildAutoVoteScores(otherEntryIds, scoredIds, config);
  const selfVote = buildSelfMaxVote(selfEntryId, config);
  const allVotes = [...voteEntries, ...autoVotes, ...selfVote];

  return { voteEntries, autoVotes, selfVote, allVotes };
}
