import type {
  Contest,
  ContestConfig,
  ContestConfigItem,
} from '../../contexts/contest/contestTypes';
import type { ProviderResult } from '../backend/types';
import { fetchProviderResult } from './fetchWithAuth';

const API = '/api/contest';

type ContestListResponse = { contests: Contest[]; currentContest: Contest | null };

// ── Contests / configs ──────────────────────────────────────────────────────

export const contestsApi = {
  async listContests(): Promise<ProviderResult<ContestListResponse>> {
    return fetchProviderResult<ContestListResponse>(`${API}/contests`);
  },

  async getContest(id: string): Promise<ProviderResult<Contest>> {
    return fetchProviderResult<Contest>(`${API}/contests/${encodeURIComponent(id)}`);
  },

  async createContest(
    data: Omit<Contest, 'id' | 'contestants' | 'voters'>,
  ): Promise<ProviderResult<Contest>> {
    return fetchProviderResult<Contest>(`${API}/contests`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateContest(id: string, updates: Partial<Contest>): Promise<ProviderResult<Contest>> {
    return fetchProviderResult<Contest>(`${API}/contests/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async deleteContest(id: string): Promise<ProviderResult<void>> {
    return fetchProviderResult<void>(`${API}/contests/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  async updateContestConfig(id: string, config: ContestConfig): Promise<ProviderResult<Contest>> {
    return contestsApi.updateContest(id, { config });
  },

  async listConfigs(): Promise<ProviderResult<ContestConfigItem[]>> {
    return fetchProviderResult<ContestConfigItem[]>(`${API}/configs`);
  },

  async createConfig(
    config: Omit<ContestConfigItem, 'id'> & { id?: string },
  ): Promise<ProviderResult<ContestConfigItem>> {
    return fetchProviderResult<ContestConfigItem>(`${API}/configs`, {
      method: 'POST',
      body: JSON.stringify(config),
    });
  },
};
