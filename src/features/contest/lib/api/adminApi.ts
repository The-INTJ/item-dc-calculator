import type { Contest, Entry, ContestConfig, ContestConfigItem } from '../../contexts/contest/contestTypes';
import type { ProviderResult } from '../backend/types';
import { fetchProviderResult } from './fetchWithAuth';

const API = '/api/contest';

export const adminApi = {
  async listContests(): Promise<ProviderResult<{ contests: Contest[]; currentContest: Contest | null }>> {
    return fetchProviderResult<{ contests: Contest[]; currentContest: Contest | null }>(
      `${API}/contests`,
    );
  },

  async getContest(id: string): Promise<ProviderResult<Contest>> {
    return fetchProviderResult<Contest>(`${API}/contests/${encodeURIComponent(id)}`);
  },

  async createContest(data: Omit<Contest, 'id' | 'entries' | 'voters'>): Promise<ProviderResult<Contest>> {
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
    return adminApi.updateContest(id, { config });
  },

  async listEntries(contestId: string): Promise<ProviderResult<Entry[]>> {
    return fetchProviderResult<Entry[]>(
      `${API}/contests/${encodeURIComponent(contestId)}/entries`,
    );
  },

  async getEntry(contestId: string, entryId: string): Promise<ProviderResult<Entry>> {
    return fetchProviderResult<Entry>(
      `${API}/contests/${encodeURIComponent(contestId)}/entries/${encodeURIComponent(entryId)}`,
    );
  },

  async createEntry(contestId: string, entry: Omit<Entry, 'id'>): Promise<ProviderResult<Entry>> {
    return fetchProviderResult<Entry>(
      `${API}/contests/${encodeURIComponent(contestId)}/entries`,
      { method: 'POST', body: JSON.stringify(entry) },
    );
  },

  async updateEntry(contestId: string, entryId: string, updates: Partial<Entry>): Promise<ProviderResult<Entry>> {
    return fetchProviderResult<Entry>(
      `${API}/contests/${encodeURIComponent(contestId)}/entries/${encodeURIComponent(entryId)}`,
      { method: 'PATCH', body: JSON.stringify(updates) },
    );
  },

  async deleteEntry(contestId: string, entryId: string): Promise<ProviderResult<void>> {
    return fetchProviderResult<void>(
      `${API}/contests/${encodeURIComponent(contestId)}/entries/${encodeURIComponent(entryId)}`,
      { method: 'DELETE' },
    );
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
