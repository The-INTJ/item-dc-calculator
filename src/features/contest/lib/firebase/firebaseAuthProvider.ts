/**
 * Firebase auth provider implementation.
 *
 * Wraps the Firebase Auth SDK so the rest of the client code doesn't import
 * `firebase/auth` directly. Intentionally DOES NOT touch Firestore — user
 * profile documents are created/updated exclusively through the server-side
 * API (`/api/contest/auth/*`). Only real-time subscriptions in lib/realtime/
 * are allowed to read Firestore from the browser.
 */

import { onAuthStateChanged, onIdTokenChanged } from 'firebase/auth';

import type {
  AuthProvider,
  AuthResult,
  IdTokenChange,
  UnsubscribeFn,
} from '../../contexts/auth/provider';
import type { RegistrationData, LoginCredentials } from '../../contexts/auth/types';
import { initializeFirebase, isFirebaseConfigured } from './config';
import { getSessionUser, setSessionUser } from './authSessionUser';
import {
  registerWithEmail,
  loginWithEmail,
  loginWithGooglePopup,
  loginAsGuest,
  logoutUser,
} from './signInFlows';
import { linkSessionWithEmail, linkSessionWithGoogle } from './guestUpgradeFlows';

/**
 * Standalone token accessor for the API layer.
 * Uses the same currentUser managed by the auth provider.
 * Returns null if not authenticated — never throws.
 */
export async function getAuthToken(): Promise<string | null> {
  const currentUser = getSessionUser();
  if (!currentUser) return null;
  try {
    return await currentUser.getIdToken();
  } catch {
    return null;
  }
}

export function createFirebaseAuthProvider(): AuthProvider {
  let auth: ReturnType<typeof initializeFirebase>['auth'];

  return {
    name: 'firebase',

    async initialize(): Promise<void> {
      const firebase = initializeFirebase();
      auth = firebase.auth;

      if (!isFirebaseConfigured() || !auth) {
        console.warn('[FirebaseAuth] Firebase not configured');
        return;
      }

      const activeAuth = auth;
      return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(activeAuth, (user) => {
          setSessionUser(user);
          unsubscribe();
          resolve();
        });
      });
    },

    register: (data: RegistrationData): Promise<AuthResult> => registerWithEmail(auth, data),

    linkWithEmail: (data: RegistrationData): Promise<AuthResult> => linkSessionWithEmail(auth, data),

    linkWithGoogle: (): Promise<AuthResult> => linkSessionWithGoogle(auth),

    login: (credentials: LoginCredentials): Promise<AuthResult> => loginWithEmail(auth, credentials),

    loginWithGoogle: (): Promise<AuthResult> => loginWithGooglePopup(auth),

    loginAnonymously: (): Promise<AuthResult> => loginAsGuest(auth),

    logout: (): Promise<AuthResult> => logoutUser(auth),

    isAuthenticated: (): boolean => getSessionUser() !== null,

    isAnonymous: (): boolean => getSessionUser()?.isAnonymous ?? false,

    getCurrentUid: (): string | null => getSessionUser()?.uid ?? null,

    getCurrentEmail: (): string | null => getSessionUser()?.email ?? null,

    getCurrentDisplayName: (): string | null => getSessionUser()?.displayName ?? null,

    async getIdToken(): Promise<string | null> {
      const currentUser = getSessionUser();
      if (!currentUser) return null;
      try {
        return await currentUser.getIdToken();
      } catch {
        return null;
      }
    },

    onIdTokenChanged(listener: (change: IdTokenChange) => void): UnsubscribeFn {
      if (!isFirebaseConfigured() || !auth) {
        return () => {};
      }
      return onIdTokenChanged(auth, async (user) => {
        // Keep the module-level `currentUser` in sync so getAuthToken() and
        // getIdToken() reflect the latest state regardless of who registered first.
        setSessionUser(user);
        if (!user) {
          listener({ uid: null, idToken: null });
          return;
        }
        try {
          const idToken = await user.getIdToken();
          listener({ uid: user.uid, idToken });
        } catch {
          listener({ uid: user.uid, idToken: null });
        }
      });
    },
  };
}
