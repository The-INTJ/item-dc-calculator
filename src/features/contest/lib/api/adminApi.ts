import type { Contest, ContestConfig, ContestConfigItem, Entry } from '../../contexts/contest/contestTypes';
import type { ProviderResult } from '../backend/types';
import { apiRequestResult } from './request';

export const adminApi = {
  async listContests(): Promise<ProviderResult<{ contests: Contest[]; currentContest: Contest | null }>> {
    return apiRequestResult<{ contests: Contest[]; currentContest: Contest | null }>(
      '/api/contest/contests',
    );
  },

  async getContest(id: string): Promise<ProviderResult<Contest>> {
    return apiRequestResult<Contest>(`/api/contest/contests/${id}`);
  },

  async createContest(data: Omit<Contest, 'id' | 'entries' | 'voters'>): Promise<ProviderResult<Contest>> {
    return apiRequestResult<Contest>('/api/contest/contests', {
      method: 'POST',
      body: data,
    });
  },

  async updateContest(id: string, updates: Partial<Contest>): Promise<ProviderResult<Contest>> {
    return apiRequestResult<Contest>(`/api/contest/contests/${id}`, {
      method: 'PATCH',
      body: updates,
    });
  },

  async deleteContest(id: string): Promise<ProviderResult<{ success: true }>> {
    return apiRequestResult<{ success: true }>(`/api/contest/contests/${id}`, {
      method: 'DELETE',
    });
  },

  async updateContestConfig(id: string, config: ContestConfig): Promise<ProviderResult<Contest>> {
    return apiRequestResult<Contest>(`/api/contest/contests/${id}`, {
      method: 'PATCH',
      body: { config },
    });
  },

  async listEntries(contestId: string): Promise<ProviderResult<Entry[]>> {
    return apiRequestResult<Entry[]>(`/api/contest/contests/${contestId}/entries`);
  },

  async getEntry(contestId: string, entryId: string): Promise<ProviderResult<Entry>> {
    return apiRequestResult<Entry>(`/api/contest/contests/${contestId}/entries/${entryId}`);
  },

  async createEntry(contestId: string, entry: Omit<Entry, 'id'>): Promise<ProviderResult<Entry>> {
    return apiRequestResult<Entry>(`/api/contest/contests/${contestId}/entries`, {
      method: 'POST',
      body: entry,
    });
  },

  async updateEntry(contestId: string, entryId: string, updates: Partial<Entry>): Promise<ProviderResult<Entry>> {
    return apiRequestResult<Entry>(`/api/contest/contests/${contestId}/entries/${entryId}`, {
      method: 'PATCH',
      body: updates,
    });
  },

  async deleteEntry(contestId: string, entryId: string): Promise<ProviderResult<{ success: true }>> {
    return apiRequestResult<{ success: true }>(`/api/contest/contests/${contestId}/entries/${entryId}`, {
      method: 'DELETE',
    });
  },

  async listConfigs(): Promise<ProviderResult<ContestConfigItem[]>> {
    return apiRequestResult<ContestConfigItem[]>('/api/contest/configs');
  },

  async createConfig(
    config: Omit<ContestConfigItem, 'id'> & { id?: string },
  ): Promise<ProviderResult<ContestConfigItem>> {
    return apiRequestResult<ContestConfigItem>('/api/contest/configs', {
      method: 'POST',
      body: config,
    });
  },
};
