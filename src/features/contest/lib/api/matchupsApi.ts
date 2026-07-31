import type { Contest, ContestRound, Matchup } from '../../contexts/contest/contestTypes';
import type { MatchupCreateInput, ProviderResult } from '../backend/types';
import { fetchProviderResult } from './fetchWithAuth';

const API = '/api/contest';

// ── Matchups / rounds ───────────────────────────────────────────────────────

export const matchupsApi = {
  async listMatchups(
    contestId: string,
    options: { roundId?: string } = {},
  ): Promise<ProviderResult<Matchup[]>> {
    const qs = options.roundId
      ? `?${new URLSearchParams({ roundId: options.roundId }).toString()}`
      : '';
    const result = await fetchProviderResult<{ matchups: Matchup[] }>(
      `${API}/contests/${encodeURIComponent(contestId)}/matchups${qs}`,
    );
    if (!result.success) return { success: false, error: result.error };
    return { success: true, data: result.data?.matchups ?? [] };
  },

  async getMatchup(contestId: string, matchupId: string): Promise<ProviderResult<Matchup>> {
    return fetchProviderResult<Matchup>(
      `${API}/contests/${encodeURIComponent(contestId)}/matchups/${encodeURIComponent(matchupId)}`,
    );
  },

  async createMatchup(
    contestId: string,
    matchup: MatchupCreateInput,
  ): Promise<ProviderResult<Matchup>> {
    return fetchProviderResult<Matchup>(
      `${API}/contests/${encodeURIComponent(contestId)}/matchups`,
      { method: 'POST', body: JSON.stringify(matchup) },
    );
  },

  async updateMatchup(
    contestId: string,
    matchupId: string,
    updates: Partial<Matchup>,
  ): Promise<ProviderResult<Matchup>> {
    return fetchProviderResult<Matchup>(
      `${API}/contests/${encodeURIComponent(contestId)}/matchups/${encodeURIComponent(matchupId)}`,
      { method: 'PATCH', body: JSON.stringify(updates) },
    );
  },

  async deleteMatchup(contestId: string, matchupId: string): Promise<ProviderResult<void>> {
    return fetchProviderResult<void>(
      `${API}/contests/${encodeURIComponent(contestId)}/matchups/${encodeURIComponent(matchupId)}`,
      { method: 'DELETE' },
    );
  },

  async setMatchupEntryName(
    contestId: string,
    matchupId: string,
    entryId: string,
    payload: { name: string; description?: string },
  ): Promise<ProviderResult<Matchup>> {
    return fetchProviderResult<Matchup>(
      `${API}/contests/${encodeURIComponent(contestId)}/matchups/${encodeURIComponent(matchupId)}/entries/${encodeURIComponent(entryId)}`,
      { method: 'PUT', body: JSON.stringify(payload) },
    );
  },

  // ── Rounds ──────────────────────────────────────────────────────────────
  async updateRound(
    contestId: string,
    roundId: string,
    updates: Partial<ContestRound>,
  ): Promise<ProviderResult<Contest>> {
    return fetchProviderResult<Contest>(
      `${API}/contests/${encodeURIComponent(contestId)}/rounds/${encodeURIComponent(roundId)}`,
      { method: 'PATCH', body: JSON.stringify(updates) },
    );
  },

  async seedRound(
    contestId: string,
    roundId: string,
    body: { entryIdPairs?: Array<[string, string] | [string]> } = {},
  ): Promise<ProviderResult<{ matchups: Matchup[] }>> {
    return fetchProviderResult<{ matchups: Matchup[] }>(
      `${API}/contests/${encodeURIComponent(contestId)}/rounds/${encodeURIComponent(roundId)}/seed`,
      { method: 'POST', body: JSON.stringify(body) },
    );
  },
};
