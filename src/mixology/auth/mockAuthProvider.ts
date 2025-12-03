/**
 * Mock auth provider for development/testing.
 *
 * Simulates Firebase auth behavior without requiring actual Firebase setup.
 * Replace with firebaseAuthProvider.ts when ready to integrate.
 */

import type { AuthProvider, AuthResult } from './provider';
import type { RegistrationData, LoginCredentials, UserProfile, UserVote, LocalSession } from './types';

interface MockUser {
  uid: string;
  email: string;
  password: string;
  profile: UserProfile;
  votes: UserVote[];
}

// In-memory "database" for mock users
const mockUsers: Map<string, MockUser> = new Map();
let currentMockUid: string | null = null;

function generateMockUid(): string {
  return `mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function createMockAuthProvider(): AuthProvider {
  return {
    name: 'mock',

    async initialize(): Promise<void> {
      // Nothing to initialize for mock provider
      console.log('[MockAuth] Initialized');
    },

    async register(data: RegistrationData): Promise<AuthResult> {
      // Check if email already exists
      for (const user of mockUsers.values()) {
        if (user.email === data.email) {
          return { success: false, error: 'Email already registered' };
        }
      }

      const uid = generateMockUid();
      const newUser: MockUser = {
        uid,
        email: data.email,
        password: data.password, // In real app, this would be hashed by Firebase
        profile: {
          displayName: data.displayName,
          email: data.email,
          role: 'viewer',
        },
        votes: [],
      };

      mockUsers.set(uid, newUser);
      currentMockUid = uid;

      console.log('[MockAuth] Registered user:', uid);
      return { success: true, uid };
    },

    async login(credentials: LoginCredentials): Promise<AuthResult> {
      for (const user of mockUsers.values()) {
        if (user.email === credentials.email) {
          if (user.password === credentials.password) {
            currentMockUid = user.uid;
            console.log('[MockAuth] Logged in user:', user.uid);
            return { success: true, uid: user.uid };
          }
          return { success: false, error: 'Invalid password' };
        }
      }
      return { success: false, error: 'User not found' };
    },

    async logout(): Promise<AuthResult> {
      console.log('[MockAuth] Logged out user:', currentMockUid);
      currentMockUid = null;
      return { success: true };
    },

    isAuthenticated(): boolean {
      return currentMockUid !== null;
    },

    getCurrentUid(): string | null {
      return currentMockUid;
    },

    async syncToBackend(session: LocalSession): Promise<AuthResult> {
      if (!currentMockUid) {
        return { success: false, error: 'Not authenticated' };
      }

      const user = mockUsers.get(currentMockUid);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Merge votes
      for (const vote of session.votes) {
        const existingIdx = user.votes.findIndex(
          (v) => v.contestId === vote.contestId && v.drinkId === vote.drinkId
        );
        if (existingIdx >= 0) {
          user.votes[existingIdx] = vote;
        } else {
          user.votes.push(vote);
        }
      }

      // Update profile if there are pending updates
      if (session.pendingSync?.profileUpdates) {
        user.profile = { ...user.profile, ...session.pendingSync.profileUpdates };
      }

      console.log('[MockAuth] Synced data for user:', currentMockUid);
      return { success: true, uid: currentMockUid };
    },

    async fetchUserData(uid: string): Promise<{ profile?: UserProfile; votes?: UserVote[] } | null> {
      const user = mockUsers.get(uid);
      if (!user) return null;

      return {
        profile: user.profile,
        votes: user.votes,
      };
    },

    async saveVote(uid: string, vote: UserVote): Promise<AuthResult> {
      const user = mockUsers.get(uid);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      const existingIdx = user.votes.findIndex(
        (v) => v.contestId === vote.contestId && v.drinkId === vote.drinkId
      );
      if (existingIdx >= 0) {
        user.votes[existingIdx] = vote;
      } else {
        user.votes.push(vote);
      }

      console.log('[MockAuth] Saved vote for user:', uid);
      return { success: true, uid };
    },

    async updateProfile(uid: string, updates: Partial<UserProfile>): Promise<AuthResult> {
      const user = mockUsers.get(uid);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      user.profile = { ...user.profile, ...updates };
      console.log('[MockAuth] Updated profile for user:', uid);
      return { success: true, uid };
    },
  };
}
