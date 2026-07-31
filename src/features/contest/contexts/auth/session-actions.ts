'use client';

import type { AuthAction, AuthContextValue, UserProfile } from './types';
import type { AuthProvider as AuthProviderContract } from './provider';
import { clearSessionCookie } from './sessionSync';
import { contestApi } from '../../lib/api/contestApi';

/** Acting on the session already open: ending it, or editing its profile. */
export function sessionActions(
  provider: AuthProviderContract,
  session: AuthContextValue['session'],
  dispatch: (action: AuthAction) => void,
) {
  async function logout(): Promise<void> {
    // Clear the server-side session cookie before tearing down the client auth
    // state — once Firebase signs the user out, `fetchWithAuth` won't have a
    // Bearer token to authenticate the DELETE.
    await clearSessionCookie();
    await provider.logout();
    dispatch({ type: 'LOGOUT' });
  }

  async function resetSessionForNewAccount(): Promise<void> {
    if (provider.isAuthenticated()) {
      await clearSessionCookie();
      await provider.logout();
    }
    dispatch({ type: 'LOGOUT' });
  }

  async function updateProfile(updates: Partial<UserProfile>): Promise<void> {
    if (!session?.firebaseUid) return;
    const allowedUpdates: Partial<Pick<UserProfile, 'displayName' | 'avatarUrl'>> = {};
    if (updates.displayName !== undefined) allowedUpdates.displayName = updates.displayName;
    if (updates.avatarUrl !== undefined) allowedUpdates.avatarUrl = updates.avatarUrl;

    const result = await contestApi.updateProfile(allowedUpdates);
    dispatch({
      type: 'UPDATE_SESSION',
      session: {
        ...session,
        profile: result.success && result.data ? result.data : { ...session.profile, ...allowedUpdates },
        updatedAt: Date.now(),
      },
    });
  }

  return { logout, resetSessionForNewAccount, updateProfile };
}
