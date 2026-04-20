/**
 * Firebase matchups provider — thin wrapper around adapter matchup operations.
 *
 * Matchup documents live under `contests/{contestId}/matchups/{matchupId}`.
 * All SDK-specific work lives in the adapter; both the client and Admin
 * adapter implementations share the same behavioral contract.
 */

import type {
  Matchup,
  MatchupsProvider,
  MatchupCreateInput,
  ProviderResult,
} from '../../backend/types';
import { success, error } from '../../backend/providerUtils';
import type { FirestoreAdapter } from '../firestoreAdapter';

export function createFirebaseMatchupsProvider(adapter: FirestoreAdapter): MatchupsProvider {
  return {
    async listByContest(contestId): Promise<ProviderResult<Matchup[]>> {
      try {
        return success(await adapter.listMatchups(contestId));
      } catch (err) {
        return error(String(err));
      }
    },

    async listByRound(contestId, roundId): Promise<ProviderResult<Matchup[]>> {
      try {
        return success(await adapter.listMatchupsByRound(contestId, roundId));
      } catch (err) {
        return error(String(err));
      }
    },

    async getById(contestId, matchupId): Promise<ProviderResult<Matchup | null>> {
      try {
        return success(await adapter.getMatchup(contestId, matchupId));
      } catch (err) {
        return error(String(err));
      }
    },

    async create(contestId, input: MatchupCreateInput): Promise<ProviderResult<Matchup>> {
      try {
        return success(await adapter.createMatchup(contestId, input));
      } catch (err) {
        return error(String(err));
      }
    },

    async update(contestId, matchupId, updates): Promise<ProviderResult<Matchup>> {
      try {
        return success(await adapter.updateMatchup(contestId, matchupId, updates));
      } catch (err) {
        return error(String(err));
      }
    },

    async delete(contestId, matchupId): Promise<ProviderResult<void>> {
      try {
        await adapter.deleteMatchup(contestId, matchupId);
        return success(undefined);
      } catch (err) {
        return error(String(err));
      }
    },

    async batchCreate(contestId, inputs: MatchupCreateInput[]): Promise<ProviderResult<Matchup[]>> {
      try {
        return success(await adapter.batchCreateMatchups(contestId, inputs));
      } catch (err) {
        return error(String(err));
      }
    },
  };
}
