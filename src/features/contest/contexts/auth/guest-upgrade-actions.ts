'use client';

import type { AuthAction, RegistrationData, UserProfile, AuthResult } from './types';
import type { AuthProvider as AuthProviderContract } from './provider';
import { createSession } from './storage';
import { contestApi } from '../../lib/api/contestApi';

/**
 * Turning a guest into a real account. The Firebase user is *linked*, not
 * replaced, so the uid survives and every vote the guest already cast stays
 * theirs. Only the credential and the profile change.
 */
export function guestUpgradeActions(
  provider: AuthProviderContract,
  dispatch: (action: AuthAction) => void,
) {
  async function finishGuestUpgrade(uid: string, displayName?: string): Promise<void> {
    // registerProfile on an existing profile syncs the token email onto the
    // profile document server-side (the token is the trusted source).
    const synced = await contestApi.registerProfile({});
    let profile: UserProfile | null = synced.success && synced.data ? synced.data : null;

    const trimmedName = displayName?.trim();
    if (trimmedName && trimmedName !== profile?.displayName) {
      const updated = await contestApi.updateProfile({ displayName: trimmedName });
      if (updated.success && updated.data) profile = updated.data;
      else if (profile) profile = { ...profile, displayName: trimmedName };
    }

    const email = provider.getCurrentEmail() ?? undefined;
    const newSession = createSession({
      firebaseUid: uid,
      profile: profile
        ? { ...profile, email: email ?? profile.email }
        : { displayName: trimmedName ?? 'Contest User', email, role: 'voter' },
    });
    dispatch({ type: 'AUTHENTICATED', session: newSession });
  }

  async function upgradeGuestWithEmail(data: RegistrationData): Promise<AuthResult> {
    const result = await provider.linkWithEmail(data);
    if (!result.success || !result.uid) {
      return { success: false, error: result.error };
    }
    await finishGuestUpgrade(result.uid, data.displayName);
    return { success: true };
  }

  async function upgradeGuestWithGoogle(): Promise<AuthResult> {
    const result = await provider.linkWithGoogle();
    if (!result.success || !result.uid) {
      return { success: false, error: result.error };
    }
    await finishGuestUpgrade(result.uid);
    return { success: true };
  }

  return { upgradeGuestWithEmail, upgradeGuestWithGoogle };
}
