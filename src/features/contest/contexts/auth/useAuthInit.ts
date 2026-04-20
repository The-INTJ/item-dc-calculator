/**
 * Auth initialization hook - handles Firebase auth state + profile hydration.
 *
 * Firebase Auth state comes from the SDK; the user's profile document is
 * fetched from the server via the API (never from Firestore directly).
 *
 * Also owns the session-cookie bridge: every ID token change (sign-in,
 * hourly refresh, sign-out) is mirrored to `POST /api/contest/auth/session`
 * so server-rendered pages (e.g. `/admin`) can authenticate the user via
 * the `__session` cookie.
 */

import { useEffect } from 'react';
import type { AuthAction } from './types';
import type { AuthProvider } from './provider';
import { createSession } from './storage';
import { contestApi } from '../../lib/api/contestApi';
import { syncSessionCookie } from './sessionSync';

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

        // Create the session cookie as early as possible so a subsequent
        // navigation to a server-rendered page (e.g. /admin) sees us as
        // authenticated. We don't await this below so the UI isn't blocked —
        // but we do kick it off before the profile fetch for minimum latency.
        const initialToken = await provider.getIdToken();
        if (initialToken) {
          void syncSessionCookie(initialToken);
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

  // Refresh the session cookie whenever the Firebase SDK rotates the ID token
  // (hourly, or after a fresh sign-in). This keeps `__session` aligned with
  // current custom claims — e.g., after a role promotion the next refresh
  // picks up the new role without requiring a logout/login cycle.
  useEffect(() => {
    const unsubscribe = provider.onIdTokenChanged(({ idToken }) => {
      if (idToken) {
        void syncSessionCookie(idToken);
      }
    });
    return unsubscribe;
  }, [provider]);
}
