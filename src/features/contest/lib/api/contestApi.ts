/**
 * Contest API Service
 * 
 * Clean API layer that returns data or null.
 * All methods throw on network errors but return null on API errors.
 * Uses Firebase ID tokens for authentication.
 */

import type { Contest, Entry } from '../../contexts/contest/contestTypes';
import { getAuthToken } from '@/contest/lib/firebase/firebaseAuthProvider';

async function apiRequest<T>(
  url: string,
  options: Parameters<typeof fetch>[1] = {}
): Promise<T | null> {
  try {
    const token = await getAuthToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, { ...options, headers: { ...headers, ...options.headers } });
    
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      console.error(`API error: ${res.status}`, json.message ?? 'Unknown error');
      return null;
    }
    
    return await res.json();
  } catch (err) {
    console.error('API request failed:', err);
    return null;
  }
}

export const contestApi = {
  // Contest Operations
  async listContests(): Promise<{ contests: Contest[]; currentContest: Contest | null } | null> {
    return apiRequest('/api/contest/contests', { method: 'GET' });
  },

  async getContest(id: string): Promise<Contest | null> {
    return apiRequest(`/api/contest/contests/${id}`, { method: 'GET' });
  },

  async createContest(data: Partial<Contest>): Promise<Contest | null> {
    return apiRequest('/api/contest/contests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateContest(id: string, updates: Partial<Contest>): Promise<Contest | null> {
    return apiRequest(`/api/contest/contests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async deleteContest(id: string): Promise<boolean> {
    const result = await apiRequest<void>(`/api/contest/contests/${id}`, { method: 'DELETE' });
    return result !== null;
  },

  // Entry Operations
  async createEntry(contestId: string, entry: Omit<Entry, 'id'>): Promise<Entry | null> {
    return apiRequest(`/api/contest/contests/${contestId}/entries`, {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  },

  async updateEntry(contestId: string, entryId: string, updates: Partial<Entry>): Promise<Entry | null> {
    return apiRequest(`/api/contest/contests/${contestId}/entries/${entryId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async deleteEntry(contestId: string, entryId: string): Promise<boolean> {
    const result = await apiRequest<void>(`/api/contest/contests/${contestId}/entries/${entryId}`, { method: 'DELETE' });
    return result !== null;
  },
};
