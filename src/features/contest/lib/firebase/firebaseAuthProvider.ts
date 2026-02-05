/**
 * Firebase auth provider implementation.
 *
 * Implements AuthProvider interface using Firebase Authentication
 * and Firestore for user data storage.
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
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';

import type { AuthProvider, AuthResult } from '../../contexts/auth/provider';
import type { RegistrationData, LoginCredentials, UserProfile } from '../../contexts/auth/types';
import { initializeFirebase, isFirebaseConfigured } from './config';

const USERS_COLLECTION = 'mixology_users';

let currentUser: User | null = null;

export function createFirebaseAuthProvider(): AuthProvider {
  let auth: ReturnType<typeof initializeFirebase>['auth'];
  let db: ReturnType<typeof initializeFirebase>['db'];

  return {
    name: 'firebase',

    async initialize(): Promise<void> {
      const firebase = initializeFirebase();
      auth = firebase.auth;
      db = firebase.db;

      if (!isFirebaseConfigured() || !auth || !db) {
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
      if (!isFirebaseConfigured() || !auth || !db) {
        return { success: false, error: 'Firebase not configured' };
      }

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        const user = userCredential.user;
        currentUser = user;

        await setDoc(doc(db, USERS_COLLECTION, user.uid), {
          displayName: data.displayName,
          email: data.email,
          role: 'viewer',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        return { success: true, uid: user.uid };
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
      if (!isFirebaseConfigured() || !auth || !db) {
        return { success: false, error: 'Firebase not configured' };
      }

      try {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        const user = userCredential.user;
        currentUser = user;

        const userRef = doc(db, USERS_COLLECTION, user.uid);
        const existing = await getDoc(userRef);
        if (!existing.exists()) {
          await setDoc(userRef, {
            displayName: user.displayName ?? user.email?.split('@')[0] ?? 'Mixology User',
            email: user.email ?? undefined,
            role: 'viewer',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }

        return { success: true, uid: user.uid };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Google sign-in failed';
        return { success: false, error: message };
      }
    },

    async loginAnonymously(): Promise<AuthResult> {
      if (!isFirebaseConfigured() || !auth || !db) {
        return { success: false, error: 'Firebase not configured' };
      }

      try {
        const userCredential = await signInAnonymously(auth);
        const user = userCredential.user;
        currentUser = user;

        const userRef = doc(db, USERS_COLLECTION, user.uid);
        const existing = await getDoc(userRef);
        if (!existing.exists()) {
          await setDoc(userRef, {
            displayName: 'Anonymous',
            role: 'viewer',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }

        return { success: true, uid: user.uid };
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

    async fetchUserData(uid: string): Promise<{ profile?: UserProfile } | null> {
      if (!isFirebaseConfigured() || !db) return null;

      try {
        const userDoc = await getDoc(doc(db, USERS_COLLECTION, uid));
        const profile = userDoc.exists() ? (userDoc.data() as UserProfile) : undefined;
        return { profile };
      } catch {
        return null;
      }
    },

    async updateProfile(uid: string, updates: Partial<UserProfile>): Promise<AuthResult> {
      if (!isFirebaseConfigured() || !db) {
        return { success: false, error: 'Firebase not configured' };
      }

      try {
        await updateDoc(doc(db, USERS_COLLECTION, uid), {
          ...updates,
          updatedAt: serverTimestamp(),
        });
        return { success: true, uid };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Update profile failed';
        return { success: false, error: message };
      }
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
