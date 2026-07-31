import type { UserProfile } from '../../contexts/auth/types';
import type { ProviderResult } from '../backend/types';
import { fetchProviderResult } from './fetchWithAuth';

const API = '/api/contest';

// ── Auth / profile ──────────────────────────────────────────────────────────

export const profileApi = {
  async getProfile(): Promise<ProviderResult<UserProfile>> {
    return fetchProviderResult<UserProfile>(`${API}/auth/profile`);
  },

  async registerProfile(
    data: { displayName?: string; email?: string; avatarUrl?: string } = {},
  ): Promise<ProviderResult<UserProfile>> {
    return fetchProviderResult<UserProfile>(`${API}/auth/register-profile`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateProfile(
    updates: Partial<Pick<UserProfile, 'displayName' | 'avatarUrl'>>,
  ): Promise<ProviderResult<UserProfile>> {
    return fetchProviderResult<UserProfile>(`${API}/auth/profile`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },
};
