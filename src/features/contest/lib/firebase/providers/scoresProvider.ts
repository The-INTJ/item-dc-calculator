/**
 * Firebase scores provider — thin wrapper around adapter score operations.
 *
 * All SDK-specific work (including the atomic vote + aggregate-update transaction)
 * lives in the adapter. Both the client and Admin adapter implementations
 * share the same behavioral contract.
 */

import type { ScoresProvider, ScoreEntry, ProviderResult } from '../../backend/types';
import { success, error } from '../../backend/providerUtils';
import type { FirestoreAdapter } from '../firestoreAdapter';

export function createFirebaseScoresProvider(adapter: FirestoreAdapter): ScoresProvider {
  return {
    async listByEntry(contestId, entryId): Promise<ProviderResult<ScoreEntry[]>> {
      try {
        return success(await adapter.listScoresByEntry(contestId, entryId));
      } catch (err) {
        return error(String(err));
      }
    },

    async listByUser(contestId, userId): Promise<ProviderResult<ScoreEntry[]>> {
      try {
        return success(await adapter.listScoresByUser(contestId, userId));
      } catch (err) {
        return error(String(err));
      }
    },

    async getById(contestId, scoreId): Promise<ProviderResult<ScoreEntry | null>> {
      try {
        return success(await adapter.getScore(contestId, scoreId));
      } catch (err) {
        return error(String(err));
      }
    },

    async submit(contestId, input): Promise<ProviderResult<ScoreEntry>> {
      try {
        return success(await adapter.submitScore(contestId, input));
      } catch (err) {
        return error(String(err));
      }
    },

    async update(contestId, scoreId, updates): Promise<ProviderResult<ScoreEntry>> {
      try {
        return success(await adapter.updateScore(contestId, scoreId, updates));
      } catch (err) {
        return error(String(err));
      }
    },

    async delete(contestId, scoreId): Promise<ProviderResult<void>> {
      try {
        await adapter.deleteScore(contestId, scoreId);
        return success(undefined);
      } catch (err) {
        return error(String(err));
      }
    },
  };
}
