/**
 * Auth initialization hook - handles Firebase auth state.
 */

import { useEffect } from 'react';
import type { AuthAction, Session } from './types';
import type { AuthProvider } from './provider';
import { createSession } from './storage';

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

        const userData = await provider.fetchUserData(uid);
        const session = createSession({
          firebaseUid: uid,
          profile: userData?.profile ?? { displayName: 'Mixology User', role: 'voter' },
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
