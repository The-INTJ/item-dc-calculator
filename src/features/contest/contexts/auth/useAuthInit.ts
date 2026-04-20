/**
 * Auth initialization hook - handles Firebase auth state + profile hydration.
 *
 * Firebase Auth state comes from the SDK; the user's profile document is
 * fetched from the server via the API (never from Firestore directly).
 */

import { useEffect } from 'react';
import type { AuthAction } from './types';
import type { AuthProvider } from './provider';
import { createSession } from './storage';
import { contestApi } from '../../lib/api/contestApi';

interface UseAuthInitOptions {
  provider: AuthProvider;
  dispatch: React.Dispatch<AuthAction>;
}

export function useAuthInit({ provider, dispatch }: UseAuthInitOptions) {
  useEffect(() => {
    const init = async () => {
      try {
        await provider.initialize();
        const uid = provider.getCurrentUid();

        if (!uid) {
          dispatch({ type: 'LOGOUT' });
          return;
        }

        const existing = await contestApi.getProfile();
        let profile = existing.success ? existing.data : undefined;

        if (!profile) {
          const created = await contestApi.registerProfile({
            displayName: provider.getCurrentDisplayName() ?? undefined,
            email: provider.getCurrentEmail() ?? undefined,
          });
          profile = created.success ? created.data : undefined;
        }

        const session = createSession({
          firebaseUid: uid,
          profile: profile ?? { displayName: 'Contest User', role: 'voter' },
        });
        dispatch({ type: 'AUTHENTICATED', session });
      } catch (err) {
        console.error('[Auth] Init failed:', err);
        dispatch({ type: 'ERROR', message: 'Failed to initialize authentication' });
      }
    };

    init();
  }, [provider, dispatch]);
}
