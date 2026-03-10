import type { Contest, Entry, ContestConfig, ContestConfigItem } from '../../contexts/contest/contestTypes';
import { getClientBackendProvider } from '../firebase/clientBackendProvider';

interface ProviderResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function runProviderRequest<T>(
  operation: (provider: Awaited<ReturnType<typeof getClientBackendProvider>>) => Promise<ProviderResult<T>>,
): Promise<ProviderResult<T>> {
  try {
    const provider = await getClientBackendProvider();
    return await operation(provider);
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export const adminApi = {
  async listContests(): Promise<ProviderResult<{ contests: Contest[]; currentContest: Contest | null }>> {
    return runProviderRequest(async (provider) => {
      const [contests, currentContest] = await Promise.all([
        provider.contests.list(),
        provider.contests.getDefault(),
      ]);

      if (!contests.success) {
        return { success: false, error: contests.error };
      }

      if (!currentContest.success) {
        return { success: false, error: currentContest.error };
      }

      return {
        success: true,
        data: {
          contests: contests.data ?? [],
          currentContest: currentContest.data ?? null,
        },
      };
    });
  },

  async getContest(id: string): Promise<ProviderResult<Contest>> {
    return runProviderRequest(async (provider) => {
      const result = await provider.contests.list();
      if (!result.success) {
        return { success: false, error: result.error };
      }

      const contest = result.data?.find((candidate) => candidate.id === id || candidate.slug === id);
      if (!contest) {
        return { success: false, error: 'Contest not found' };
      }

      return { success: true, data: contest };
    });
  },

  async createContest(data: Omit<Contest, 'id' | 'entries' | 'voters'>): Promise<ProviderResult<Contest>> {
    return runProviderRequest((provider) => provider.contests.create(data));
  },

  async updateContest(id: string, updates: Partial<Contest>): Promise<ProviderResult<Contest>> {
    return runProviderRequest((provider) => provider.contests.update(id, updates));
  },

  async deleteContest(id: string): Promise<ProviderResult<void>> {
    return runProviderRequest((provider) => provider.contests.delete(id));
  },

  async updateContestConfig(id: string, config: ContestConfig): Promise<ProviderResult<Contest>> {
    return runProviderRequest((provider) => provider.contests.update(id, { config }));
  },

  async listEntries(contestId: string): Promise<ProviderResult<Entry[]>> {
    return runProviderRequest((provider) => provider.entries.listByContest(contestId));
  },

  async getEntry(contestId: string, entryId: string): Promise<ProviderResult<Entry>> {
    return runProviderRequest(async (provider) => {
      const result = await provider.entries.getById(contestId, entryId);
      if (!result.success || !result.data) {
        return { success: false, error: result.error ?? 'Entry not found' };
      }

      return { success: true, data: result.data };
    });
  },

  async createEntry(contestId: string, entry: Omit<Entry, 'id'>): Promise<ProviderResult<Entry>> {
    return runProviderRequest((provider) => provider.entries.create(contestId, entry));
  },

  async updateEntry(contestId: string, entryId: string, updates: Partial<Entry>): Promise<ProviderResult<Entry>> {
    return runProviderRequest((provider) => provider.entries.update(contestId, entryId, updates));
  },

  async deleteEntry(contestId: string, entryId: string): Promise<ProviderResult<void>> {
    return runProviderRequest((provider) => provider.entries.delete(contestId, entryId));
  },

  async listConfigs(): Promise<ProviderResult<ContestConfigItem[]>> {
    return runProviderRequest((provider) => provider.configs.list());
  },

  async createConfig(
    config: Omit<ContestConfigItem, 'id'> & { id?: string },
  ): Promise<ProviderResult<ContestConfigItem>> {
    return runProviderRequest((provider) => provider.configs.create(config));
  },
};
