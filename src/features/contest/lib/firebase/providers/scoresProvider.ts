/**
 * Firebase scores provider.
 *
 * Handles CRUD operations for scores with locking support for concurrent updates.
 * Scores are stored as arrays in contest documents.
 */

import type { ScoresProvider, ScoreEntry, ProviderResult } from '../../helpers/types';
import { generateId, success, error, withDb } from '../../helpers/providerUtils';
import { normalizeScorePayload } from '../../helpers/scoreNormalization';
import { createArrayEntityOperations } from '../arrayEntityAdapter';
import type { FirestoreAdapter } from '../firestoreAdapter';
import { updateEntryScores } from '../scoring/scoreTransaction';

/**
 * Creates the Firebase scores provider.
 */
export function createFirebaseScoresProvider(adapter: FirestoreAdapter): ScoresProvider {
  const baseOperations = createArrayEntityOperations<ScoreEntry>({
    adapter,
    getArray: (contest) => contest.scores,
    setArray: (scores) => ({ scores }),
    entityName: 'Score',
    idPrefix: 'score',
  });

  return {
    async listByEntry(contestId, entryId): Promise<ProviderResult<ScoreEntry[]>> {
      const contest = await adapter.getContest(contestId);
      if (!contest) return error('Contest not found');
      const scores = contest.scores.filter((s) => s.entryId === entryId);
      return success(scores);
    },

    async listByJudge(contestId, judgeId): Promise<ProviderResult<ScoreEntry[]>> {
      const contest = await adapter.getContest(contestId);
      if (!contest) return error('Contest not found');
      const scores = contest.scores.filter((s) => s.judgeId === judgeId);
      return success(scores);
    },

    getById: baseOperations.getById,

    submit(contestId, input): Promise<ProviderResult<ScoreEntry>> {
      const inputEntryId = input.entryId ?? '';

      return withDb(adapter, () =>
        updateEntryScores({
          db: adapter.getDb()!,
          contestId,
          entryId: inputEntryId,
          onUpdate: (contest) => {
            const existingIndex = contest.scores.findIndex(
              (score: ScoreEntry) =>
                score.entryId === inputEntryId &&
                score.judgeId === input.judgeId
            );

            let updatedScores = [...contest.scores];
            let updatedScore: ScoreEntry;
            const normalized = normalizeScorePayload({
              contest,
              updates: input.breakdown,
              naSections: input.naSections,
            });

            if (existingIndex !== -1) {
              const existingScore = contest.scores[existingIndex];
              updatedScore = {
                ...existingScore,
                entryId: inputEntryId,
                breakdown: normalized.breakdown,
                notes: input.notes ?? existingScore.notes,
                naSections: normalized.naSections,
              };
              updatedScores[existingIndex] = updatedScore;
            } else {
              updatedScore = {
                ...input,
                id: generateId('score'),
                entryId: inputEntryId,
                breakdown: normalized.breakdown,
                naSections: normalized.naSections,
              };
              updatedScores = [...contest.scores, updatedScore];
            }

            return { updatedScores, result: updatedScore };
          },
        })
      );
    },

    async update(contestId, scoreId, updates): Promise<ProviderResult<ScoreEntry>> {
      const contest = await adapter.getContest(contestId);
      if (!contest) return error('Contest not found');

      const scoreIdx = contest.scores.findIndex((s) => s.id === scoreId);
      if (scoreIdx === -1) return error('Score not found');

      const scoreEntryId = contest.scores[scoreIdx].entryId ?? '';

      return withDb(adapter, () =>
        updateEntryScores({
          db: adapter.getDb()!,
          contestId,
          entryId: scoreEntryId,
          onUpdate: (currentContest) => {
            const currentScoreIdx = currentContest.scores.findIndex((s: ScoreEntry) => s.id === scoreId);
            if (currentScoreIdx === -1) {
              throw new Error('Score not found');
            }

            const current = currentContest.scores[currentScoreIdx];
            const normalized = normalizeScorePayload({
              contest: currentContest,
              baseBreakdown: current.breakdown,
              updates: updates.breakdown,
              naSections: updates.naSections ?? current.naSections,
            });
            const updatedScore: ScoreEntry = {
              ...current,
              breakdown: normalized.breakdown,
              notes: updates.notes ?? current.notes,
              naSections: normalized.naSections,
            };

            const updatedScores = [...currentContest.scores];
            updatedScores[currentScoreIdx] = updatedScore;

            return { updatedScores, result: updatedScore };
          },
        })
      );
    },

    delete: baseOperations.delete,
  };
}
