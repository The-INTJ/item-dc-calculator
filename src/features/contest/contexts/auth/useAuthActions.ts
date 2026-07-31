'use client';

import type { AuthAction, AuthContextValue } from './types';
import type { AuthProvider as AuthProviderContract } from './provider';
import { signInActions } from './sign-in-actions';
import { guestUpgradeActions } from './guest-upgrade-actions';
import { sessionActions } from './session-actions';

/**
 * Session-changing auth actions exposed through `AuthContextValue`. Each action
 * drives the auth provider (Firebase) plus the profile API, then dispatches
 * the resulting session into the auth reducer.
 *
 * Grouped by what they do to a session: open one, upgrade a guest's, or act on
 * the one already open.
 */
export function useAuthActions(
  provider: AuthProviderContract,
  session: AuthContextValue['session'],
  dispatch: (action: AuthAction) => void,
) {
  return {
    ...signInActions(provider, dispatch),
    ...guestUpgradeActions(provider, dispatch),
    ...sessionActions(provider, session, dispatch),
  };
}
