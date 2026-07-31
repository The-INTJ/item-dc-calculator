import type { ScoreBreakdown, ScoreEntry, UserRole } from '../../contexts/contest/contestTypes';
import type { ProviderResult } from '../backend/types';
import { fetchProviderResult } from './fetchWithAuth';

const API = '/api/contest';

// ── Scores ──────────────────────────────────────────────────────────────────

export const scoresApi = {
  async getScoresForUser(contestId: string, userId: string): Promise<ProviderResult<ScoreEntry[]>> {
    const params = new URLSearchParams({ userId });
    const result = await fetchProviderResult<{ scores: ScoreEntry[] }>(
      `${API}/contests/${encodeURIComponent(contestId)}/scores?${params}`,
    );
    if (!result.success) return { success: false, error: result.error };
    return { success: true, data: result.data?.scores ?? [] };
  },

  async getScoresForEntry(contestId: string, entryId: string): Promise<ProviderResult<ScoreEntry[]>> {
    const params = new URLSearchParams({ entryId });
    const result = await fetchProviderResult<{ scores: ScoreEntry[] }>(
      `${API}/contests/${encodeURIComponent(contestId)}/scores?${params}`,
    );
    if (!result.success) return { success: false, error: result.error };
    return { success: true, data: result.data?.scores ?? [] };
  },

  async submitScore(
    contestId: string,
    data: {
      entryId: string;
      /**
       * Matchup this vote belongs to. Required server-side; optional here only
       * so existing call sites compile during the matchup refactor. PR 6
       * rewrites `useRoundVoting` to always pass a `matchupId`.
       */
      matchupId?: string;
      userName?: string;
      userRole?: UserRole;
      breakdown: Partial<ScoreBreakdown>;
      notes?: string;
    },
  ): Promise<ProviderResult<ScoreEntry>> {
    return fetchProviderResult<ScoreEntry>(
      `${API}/contests/${encodeURIComponent(contestId)}/scores`,
      { method: 'POST', body: JSON.stringify(data) },
    );
  },

  /**
   * Submit a complete matchup ballot atomically. If the matchup closed while
   * the voter was scoring, the whole ballot is rejected with
   * `errorCode: MATCHUP_CLOSED` — no partial ballots.
   */
  async submitBallot(
    contestId: string,
    matchupId: string,
    data: {
      userName?: string;
      userRole?: UserRole;
      scores: Array<{ entryId: string; breakdown: ScoreBreakdown }>;
    },
  ): Promise<ProviderResult<{ scores: ScoreEntry[] }>> {
    return fetchProviderResult<{ scores: ScoreEntry[] }>(
      `${API}/contests/${encodeURIComponent(contestId)}/matchups/${encodeURIComponent(matchupId)}/ballot`,
      { method: 'POST', body: JSON.stringify(data) },
    );
  },
};
