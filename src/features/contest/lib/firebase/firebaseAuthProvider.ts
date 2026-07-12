/**
 * Firebase auth provider implementation.
 *
 * Wraps the Firebase Auth SDK so the rest of the client code doesn't import
 * `firebase/auth` directly. Intentionally DOES NOT touch Firestore — user
 * profile documents are created/updated exclusively through the server-side
 * API (`/api/contest/auth/*`). Only real-time subscriptions in lib/realtime/
 * are allowed to read Firestore from the browser.
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  onIdTokenChanged,
  linkWithCredential,
  linkWithPopup,
  updateProfile as updateFirebaseProfile,
  EmailAuthProvider,
  GoogleAuthProvider,
  type User,
} from 'firebase/auth';

import type {
  AuthProvider,
  AuthResult,
  IdTokenChange,
  UnsubscribeFn,
} from '../../contexts/auth/provider';
import type { RegistrationData, LoginCredentials } from '../../contexts/auth/types';
import { initializeFirebase, isFirebaseConfigured } from './config';

let currentUser: User | null = null;

/**
 * Standalone token accessor for the API layer.
 * Uses the same currentUser managed by the auth provider.
 * Returns null if not authenticated — never throws.
 */
export async function getAuthToken(): Promise<string | null> {
  if (!currentUser) return null;
  try {
    return await currentUser.getIdToken();
  } catch {
    return null;
  }
}

/** Friendly messages for the account-linking failure modes users actually hit. */
function mapLinkError(error: unknown): string {
  const code = (error as { code?: string })?.code ?? '';
  if (code === 'auth/email-already-in-use' || code === 'auth/credential-already-in-use') {
    return 'That email already has an account. Sign in with it instead — your guest activity won’t carry over.';
  }
  if (code === 'auth/provider-already-linked') {
    return 'This session is already linked to an account.';
  }
  return error instanceof Error ? error.message : 'Account upgrade failed';
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
          currentUser = user;
          unsubscribe();
          resolve();
        });
      });
    },

    async register(data: RegistrationData): Promise<AuthResult> {
      if (!isFirebaseConfigured() || !auth) {
        return { success: false, error: 'Firebase not configured' };
      }

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        currentUser = userCredential.user;
        if (data.displayName.trim()) {
          // Persist the display name onto the Firebase Auth record too, so
          // token-derived names match the profile document.
          await updateFirebaseProfile(userCredential.user, {
            displayName: data.displayName.trim(),
          }).catch(() => {});
        }
        return { success: true, uid: userCredential.user.uid };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Registration failed';
        return { success: false, error: message };
      }
    },

    async linkWithEmail(data: RegistrationData): Promise<AuthResult> {
      if (!isFirebaseConfigured() || !auth) {
        return { success: false, error: 'Firebase not configured' };
      }
      const user = auth.currentUser;
      if (!user) {
        return { success: false, error: 'No active session to upgrade' };
      }

      try {
        const credential = EmailAuthProvider.credential(data.email, data.password);
        const userCredential = await linkWithCredential(user, credential);
        currentUser = userCredential.user;
        if (data.displayName.trim()) {
          await updateFirebaseProfile(userCredential.user, {
            displayName: data.displayName.trim(),
          }).catch(() => {});
        }
        return { success: true, uid: userCredential.user.uid };
      } catch (error: unknown) {
        return { success: false, error: mapLinkError(error) };
      }
    },

    async linkWithGoogle(): Promise<AuthResult> {
      if (!isFirebaseConfigured() || !auth) {
        return { success: false, error: 'Firebase not configured' };
      }
      const user = auth.currentUser;
      if (!user) {
        return { success: false, error: 'No active session to upgrade' };
      }

      try {
        const userCredential = await linkWithPopup(user, new GoogleAuthProvider());
        currentUser = userCredential.user;
        return { success: true, uid: userCredential.user.uid };
      } catch (error: unknown) {
        return { success: false, error: mapLinkError(error) };
      }
    },

    async login(credentials: LoginCredentials): Promise<AuthResult> {
      if (!isFirebaseConfigured() || !auth) {
        return { success: false, error: 'Firebase not configured' };
      }

      try {
        const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
        currentUser = userCredential.user;
        return { success: true, uid: userCredential.user.uid };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Login failed';
        return { success: false, error: message };
      }
    },

    async loginWithGoogle(): Promise<AuthResult> {
      if (!isFirebaseConfigured() || !auth) {
        return { success: false, error: 'Firebase not configured' };
      }

      try {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        currentUser = userCredential.user;
        return { success: true, uid: userCredential.user.uid };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Google sign-in failed';
        return { success: false, error: message };
      }
    },

    async loginAnonymously(): Promise<AuthResult> {
      if (!isFirebaseConfigured() || !auth) {
        return { success: false, error: 'Firebase not configured' };
      }

      try {
        const userCredential = await signInAnonymously(auth);
        currentUser = userCredential.user;
        return { success: true, uid: userCredential.user.uid };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Anonymous sign-in failed';
        return { success: false, error: message };
      }
    },

    async logout(): Promise<AuthResult> {
      if (!isFirebaseConfigured() || !auth) {
        return { success: false, error: 'Firebase not configured' };
      }

      try {
        await signOut(auth);
        currentUser = null;
        return { success: true };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Logout failed';
        return { success: false, error: message };
      }
    },

    isAuthenticated(): boolean {
      return currentUser !== null;
    },

    isAnonymous(): boolean {
      return currentUser?.isAnonymous ?? false;
    },

    getCurrentUid(): string | null {
      return currentUser?.uid ?? null;
    },

    getCurrentEmail(): string | null {
      return currentUser?.email ?? null;
    },

    getCurrentDisplayName(): string | null {
      return currentUser?.displayName ?? null;
    },

    async getIdToken(): Promise<string | null> {
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
        currentUser = user;
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
