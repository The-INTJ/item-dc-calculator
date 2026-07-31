import type { Contestant } from '../../contexts/contest/contestTypes';
import type { ProviderResult } from '../backend/types';
import { fetchProviderResult } from './fetchWithAuth';

const API = '/api/contest';

// ── Contestants ─────────────────────────────────────────────────────────────

export const contestantsApi = {
  async listContestants(contestId: string): Promise<ProviderResult<Contestant[]>> {
    return fetchProviderResult<Contestant[]>(
      `${API}/contests/${encodeURIComponent(contestId)}/contestants`,
    );
  },

  async getContestant(contestId: string, contestantId: string): Promise<ProviderResult<Contestant>> {
    return fetchProviderResult<Contestant>(
      `${API}/contests/${encodeURIComponent(contestId)}/contestants/${encodeURIComponent(contestantId)}`,
    );
  },

  async createContestant(
    contestId: string,
    contestant: Omit<Contestant, 'id'>,
  ): Promise<ProviderResult<Contestant>> {
    return fetchProviderResult<Contestant>(
      `${API}/contests/${encodeURIComponent(contestId)}/contestants`,
      { method: 'POST', body: JSON.stringify(contestant) },
    );
  },

  async updateContestant(
    contestId: string,
    contestantId: string,
    updates: Partial<Contestant>,
  ): Promise<ProviderResult<Contestant>> {
    return fetchProviderResult<Contestant>(
      `${API}/contests/${encodeURIComponent(contestId)}/contestants/${encodeURIComponent(contestantId)}`,
      { method: 'PATCH', body: JSON.stringify(updates) },
    );
  },

  async deleteContestant(contestId: string, contestantId: string): Promise<ProviderResult<void>> {
    return fetchProviderResult<void>(
      `${API}/contests/${encodeURIComponent(contestId)}/contestants/${encodeURIComponent(contestantId)}`,
      { method: 'DELETE' },
    );
  },

  async registerAsContestant(
    contestId: string,
    displayName: string,
  ): Promise<ProviderResult<{ registered: boolean; contestantId?: string }>> {
    return fetchProviderResult<{ registered: boolean; contestantId?: string }>(
      `${API}/contests/${encodeURIComponent(contestId)}/register`,
      { method: 'POST', body: JSON.stringify({ displayName }) },
    );
  },
};
