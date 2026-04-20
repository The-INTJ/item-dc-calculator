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
  GoogleAuthProvider,
  type User,
} from 'firebase/auth';

import type { AuthProvider, AuthResult } from '../../contexts/auth/provider';
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
        return { success: true, uid: userCredential.user.uid };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Registration failed';
        return { success: false, error: message };
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
  };
}
