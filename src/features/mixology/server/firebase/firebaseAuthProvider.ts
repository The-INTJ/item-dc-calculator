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
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';

import type { AuthProvider, AuthResult } from '../../lib/auth/provider';
import type {
  RegistrationData,
  LoginCredentials,
  UserProfile,
  UserVote,
  LocalSession,
} from '../../lib/auth/types';
import { initializeFirebase, isFirebaseConfigured } from './config';

// Firestore collection names
const USERS_COLLECTION = 'mixology_users';
const VOTES_COLLECTION = 'mixology_votes';

// Current Firebase user
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

      const activeAuth = auth;
      const activeDb = db;

      if (!isFirebaseConfigured() || !activeAuth || !activeDb) {
        console.warn('[FirebaseAuth] Firebase not configured or unavailable; using local-only mode.');
        return;
      }

      // Listen for auth state changes
      return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(activeAuth, (user) => {
          currentUser = user;
          console.log('[FirebaseAuth] Auth state changed:', user?.uid ?? 'signed out');
          unsubscribe(); // Only need initial state
          resolve();
        });
      });
    },

    async register(data: RegistrationData): Promise<AuthResult> {
      if (!isFirebaseConfigured() || !auth || !db) {
        return { success: false, error: 'Firebase not configured' };
      }

      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          data.email,
          data.password
        );

        const user = userCredential.user;
        currentUser = user;

        // Create user profile in Firestore
        await setDoc(doc(db, USERS_COLLECTION, user.uid), {
          displayName: data.displayName,
          email: data.email,
          role: 'viewer',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        console.log('[FirebaseAuth] Registered user:', user.uid);
        return { success: true, uid: user.uid };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Registration failed';
        console.error('[FirebaseAuth] Registration error:', message);
        return { success: false, error: message };
      }
    },

    async login(credentials: LoginCredentials): Promise<AuthResult> {
      if (!isFirebaseConfigured() || !auth) {
        return { success: false, error: 'Firebase not configured' };
      }

      try {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          credentials.email,
          credentials.password
        );

        const user = userCredential.user;
        currentUser = user;

        console.log('[FirebaseAuth] Logged in user:', user.uid);
        return { success: true, uid: user.uid };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Login failed';
        console.error('[FirebaseAuth] Login error:', message);
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

        console.log('[FirebaseAuth] Logged in with Google:', user.uid);
        return { success: true, uid: user.uid };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Google sign-in failed';
        console.error('[FirebaseAuth] Google login error:', message);
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

        console.log('[FirebaseAuth] Logged in anonymously:', user.uid);
        return { success: true, uid: user.uid };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Anonymous sign-in failed';
        console.error('[FirebaseAuth] Anonymous login error:', message);
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
        console.log('[FirebaseAuth] Logged out');
        return { success: true };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Logout failed';
        console.error('[FirebaseAuth] Logout error:', message);
        return { success: false, error: message };
      }
    },

    isAuthenticated(): boolean {
      return currentUser !== null;
    },

    getCurrentUid(): string | null {
      return currentUser?.uid ?? null;
    },

    async syncToBackend(session: LocalSession): Promise<AuthResult> {
      if (!isFirebaseConfigured() || !currentUser || !db) {
        return { success: false, error: 'Not authenticated or Firebase not configured' };
      }

      try {
        const uid = currentUser.uid;

        // Sync profile updates
        if (session.pendingSync?.profileUpdates) {
          await updateDoc(doc(db, USERS_COLLECTION, uid), {
            ...session.pendingSync.profileUpdates,
            updatedAt: serverTimestamp(),
          });
        }

        // Sync votes
        if (session.pendingSync?.votes) {
          for (const vote of session.pendingSync.votes) {
            await this.saveVote(uid, vote);
          }
        }

        console.log('[FirebaseAuth] Synced data for user:', uid);
        return { success: true, uid };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Sync failed';
        console.error('[FirebaseAuth] Sync error:', message);
        return { success: false, error: message };
      }
    },

    async fetchUserData(
      uid: string
    ): Promise<{ profile?: UserProfile; votes?: UserVote[] } | null> {
      if (!isFirebaseConfigured() || !db) {
        return null;
      }

      try {
        // Fetch profile
        const userDoc = await getDoc(doc(db, USERS_COLLECTION, uid));
        const profile = userDoc.exists()
          ? (userDoc.data() as UserProfile)
          : undefined;

        // Fetch votes
        const votesQuery = query(
          collection(db, VOTES_COLLECTION),
          where('userId', '==', uid)
        );
        const votesSnapshot = await getDocs(votesQuery);
        const votes: UserVote[] = votesSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            contestId: data.contestId,
            drinkId: data.drinkId,
            score: data.score,
            breakdown: data.breakdown,
            notes: data.notes,
            timestamp: data.timestamp?.toMillis?.() ?? data.timestamp ?? Date.now(),
          };
        });

        return { profile, votes };
      } catch (error) {
        console.error('[FirebaseAuth] Fetch user data error:', error);
        return null;
      }
    },

    async saveVote(uid: string, vote: UserVote): Promise<AuthResult> {
      if (!isFirebaseConfigured() || !db) {
        return { success: false, error: 'Firebase not configured' };
      }

      try {
        // Check if vote already exists for this user/contest/drink
        const votesQuery = query(
          collection(db, VOTES_COLLECTION),
          where('userId', '==', uid),
          where('contestId', '==', vote.contestId),
          where('drinkId', '==', vote.drinkId)
        );
        const existing = await getDocs(votesQuery);

        if (!existing.empty) {
          // Update existing vote
          const voteDoc = existing.docs[0];
          await updateDoc(doc(db, VOTES_COLLECTION, voteDoc.id), {
            score: vote.score,
            breakdown: vote.breakdown,
            notes: vote.notes,
            timestamp: vote.timestamp,
            updatedAt: serverTimestamp(),
          });
        } else {
          // Create new vote
          await addDoc(collection(db, VOTES_COLLECTION), {
            userId: uid,
            contestId: vote.contestId,
            drinkId: vote.drinkId,
            score: vote.score,
            breakdown: vote.breakdown,
            notes: vote.notes,
            timestamp: vote.timestamp,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }

        console.log('[FirebaseAuth] Saved vote for user:', uid);
        return { success: true, uid };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Save vote failed';
        console.error('[FirebaseAuth] Save vote error:', message);
        return { success: false, error: message };
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

        console.log('[FirebaseAuth] Updated profile for user:', uid);
        return { success: true, uid };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Update profile failed';
        console.error('[FirebaseAuth] Update profile error:', message);
        return { success: false, error: message };
      }
    },
  };
}
