'use client';

import type { UserProfile } from './types';
import { contestApi } from '../../lib/api/contestApi';

/**
 * The profile a newly signed-in user should carry. Returning users have one
 * already; first-time sign-ins get one created. If neither call succeeds the
 * session still opens on a local profile rather than failing the sign-in —
 * the server profile is a convenience, the Firebase account is the identity.
 */
export async function resolveProfileOrCreate(
  fallbackEmail?: string,
  fallbackDisplayName?: string,
): Promise<UserProfile> {
  const existing = await contestApi.getProfile();
  if (existing.success && existing.data) {
    return {
      ...existing.data,
      email: fallbackEmail ?? existing.data.email,
    };
  }

  const created = await contestApi.registerProfile({
    displayName: fallbackDisplayName,
    email: fallbackEmail,
  });
  if (created.success && created.data) return created.data;

  return {
    displayName: fallbackDisplayName ?? fallbackEmail?.split('@')[0] ?? 'Contest User',
    email: fallbackEmail,
    role: 'voter',
  };
}
