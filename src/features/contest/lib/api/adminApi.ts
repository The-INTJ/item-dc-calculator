/**
 * Admin API Service Layer
 * 
 * Centralized service for all admin API calls.
 * Uses Firebase ID tokens for authentication.
 */

import type { Contest, Entry, ContestConfig } from '../../contexts/contest/contestTypes';
import { getAuthToken } from '@/contest/lib/firebase/firebaseAuthProvider';

interface ProviderResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Internal helper for making authenticated API requests
 */
async function apiRequest<T>(
  url: string, 
  options: Record<string, unknown> & { method?: string; body?: string; headers?: Record<string, string> } = {}
): Promise<ProviderResult<T>> {
  try {
    const token = await getAuthToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      ...options,
      headers: { ...headers, ...options.headers },
    });
    
    const json = await res.json();
    
    if (!res.ok) {
      return { 
        success: false, 
        error: json.message ?? `Request failed with status ${res.status}` 
      };
    }
    
    return { success: true, data: json };
  } catch (err) {
    return { 
      success: false, 
      error: err instanceof Error ? err.message : String(err)
    };
  }
}

export const adminApi = {
  // ==================
  // Contest Operations
  // ==================
  
  /**
   * Fetch all contests
   */
  async listContests(): Promise<ProviderResult<{ contests: Contest[]; currentContest: Contest | null }>> {
    return apiRequest('/api/contest/contests', { method: 'GET' });
  },

  /**
   * Fetch a single contest by ID
   */
  async getContest(id: string): Promise<ProviderResult<Contest>> {
    return apiRequest(`/api/contest/contests/${id}`, { method: 'GET' });
  },

  /**
   * Create a new contest
   */
  async createContest(data: Omit<Contest, 'id' | 'entries' | 'voters'>): Promise<ProviderResult<Contest>> {
    return apiRequest('/api/contest/contests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update an existing contest (partial update)
   */
  async updateContest(id: string, updates: Partial<Contest>): Promise<ProviderResult<Contest>> {
    return apiRequest(`/api/contest/contests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  /**
   * Delete a contest
   */
  async deleteContest(id: string): Promise<ProviderResult<void>> {
    return apiRequest(`/api/contest/contests/${id}`, { method: 'DELETE' });
  },

  /**
   * Update contest config
   */
  async updateContestConfig(id: string, config: ContestConfig): Promise<ProviderResult<Contest>> {
    return apiRequest(`/api/contest/contests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ config }),
    });
  },

  // =================
  // Entry Operations (Mixologists/Drinks)
  // =================

  /**
   * List all entries for a contest
   */
  async listEntries(contestId: string): Promise<ProviderResult<Entry[]>> {
    return apiRequest(`/api/contest/contests/${contestId}/entries`, { method: 'GET' });
  },

  /**
   * Get a single entry by ID
   */
  async getEntry(contestId: string, entryId: string): Promise<ProviderResult<Entry>> {
    return apiRequest(`/api/contest/contests/${contestId}/entries/${entryId}`, { method: 'GET' });
  },

  /**
   * Create a new entry
   */
  async createEntry(contestId: string, entry: Omit<Entry, 'id'>): Promise<ProviderResult<Entry>> {
    return apiRequest(`/api/contest/contests/${contestId}/entries`, {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  },

  /**
   * Update an existing entry
   */
  async updateEntry(contestId: string, entryId: string, updates: Partial<Entry>): Promise<ProviderResult<Entry>> {
    return apiRequest(`/api/contest/contests/${contestId}/entries/${entryId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  /**
   * Delete an entry
   */
  async deleteEntry(contestId: string, entryId: string): Promise<ProviderResult<void>> {
    return apiRequest(`/api/contest/contests/${contestId}/entries/${entryId}`, { method: 'DELETE' });
  },
};
