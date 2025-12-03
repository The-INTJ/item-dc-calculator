'use client';

/**
 * Auth context and provider for Mixology.
 *
 * Manages user sessions, guest mode, and authentication state.
 * Automatically persists to localStorage and syncs with backend when possible.
 */

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type {
  AuthContextValue,
  LocalSession,
  RegistrationData,
  LoginCredentials,
  UserProfile,
  UserVote,
} from './types';
import type { AuthProvider } from './provider';
import {
  readSession,
  writeSession,
  createGuestSession,
  addVoteToSession,
  updateProfileInSession,
  upgradeToRegistered,
  markAsSynced,
  clearPendingSync,
  recordSyncFailure,
} from './storage';
import { createFirebaseAuthProvider } from '../firebase/firebaseAuthProvider';

// Create context with undefined default (must be used within provider)
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Singleton auth provider - using Firebase
let authProvider: AuthProvider | null = null;

function getAuthProvider(): AuthProvider {
  if (!authProvider) {
    // Using Firebase auth provider
    authProvider = createFirebaseAuthProvider();
  }
  return authProvider;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function MixologyAuthProvider({ children }: AuthProviderProps) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<LocalSession | null>(null);

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      const provider = getAuthProvider();
      await provider.initialize();

      // Load existing session from localStorage
      const existingSession = readSession();
      if (existingSession) {
        setSession(existingSession);

        // If user was registered, try to restore auth state
        if (existingSession.firebaseUid && provider.isAuthenticated()) {
          // Fetch latest data from backend
          const userData = await provider.fetchUserData(existingSession.firebaseUid);
          if (userData) {
            // Merge backend data with local
            const merged: LocalSession = {
              ...existingSession,
              profile: { ...existingSession.profile, ...userData.profile },
              votes: mergeVotes(existingSession.votes, userData.votes ?? []),
            };
            setSession(merged);
            writeSession(merged);
          }
        }
      }

      setLoading(false);
    };

    init();
  }, []);

  // Start guest session
  const startGuestSession = useCallback(async (displayName?: string) => {
    const newSession = createGuestSession(displayName);
    setSession(newSession);
    writeSession(newSession);
  }, []);

  // Register new account
  const register = useCallback(
    async (data: RegistrationData): Promise<{ success: boolean; error?: string }> => {
      const provider = getAuthProvider();
      const result = await provider.register(data);

      if (!result.success || !result.uid) {
        return { success: false, error: result.error };
      }

      // Upgrade local session
      const upgraded = upgradeToRegistered(result.uid, {
        displayName: data.displayName,
        email: data.email,
      });

      if (upgraded) {
        // Sync any pending data
        const syncResult = await provider.syncToBackend(upgraded);
        if (syncResult.success) {
          const synced = markAsSynced(result.uid);
          setSession(synced);
        } else {
          setSession(upgraded);
        }
      }

      return { success: true };
    },
    []
  );

  // Login
  const login = useCallback(
    async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
      const provider = getAuthProvider();
      const result = await provider.login(credentials);

      if (!result.success || !result.uid) {
        return { success: false, error: result.error };
      }

      // Fetch user data from backend
      const userData = await provider.fetchUserData(result.uid);

      // Get current local session (may have guest data)
      const currentLocal = readSession();

      // Create new session with backend data
      const newSession: LocalSession = {
        sessionId: currentLocal?.sessionId ?? `sess_${Date.now()}`,
        status: 'synced',
        firebaseUid: result.uid,
        profile: userData?.profile ?? {
          displayName: credentials.email.split('@')[0],
          email: credentials.email,
          role: 'viewer',
        },
        votes: userData?.votes ?? [],
        createdAt: currentLocal?.createdAt ?? Date.now(),
        updatedAt: Date.now(),
      };

      // If there was local guest data, sync it to backend
      if (currentLocal && currentLocal.status === 'guest' && currentLocal.votes.length > 0) {
        for (const vote of currentLocal.votes) {
          await provider.saveVote(result.uid, vote);
        }
        newSession.votes = mergeVotes(newSession.votes, currentLocal.votes);
      }

      setSession(newSession);
      writeSession(newSession);

      return { success: true };
    },
    []
  );

  // Logout
  const logout = useCallback(async () => {
    const provider = getAuthProvider();
    await provider.logout();

    // Keep local session but mark as guest
    if (session) {
      const guestSession: LocalSession = {
        ...session,
        status: 'guest',
        firebaseUid: undefined,
        updatedAt: Date.now(),
      };
      setSession(guestSession);
      writeSession(guestSession);
    }
  }, [session]);

  // Update profile
  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      const updated = updateProfileInSession(updates);
      if (updated) {
        setSession(updated);

        // If synced, also update backend
        if (updated.status === 'synced' && updated.firebaseUid) {
          const provider = getAuthProvider();
          await provider.updateProfile(updated.firebaseUid, updates);
        }
      }
    },
    []
  );

  // Record vote
  const recordVote = useCallback(
    async (vote: Omit<UserVote, 'timestamp'>) => {
      const fullVote: UserVote = { ...vote, timestamp: Date.now() };
      const updated = addVoteToSession(fullVote);

      if (updated) {
        setSession(updated);

        // If synced, also save to backend
        if (updated.status === 'synced' && updated.firebaseUid) {
          const provider = getAuthProvider();
          await provider.saveVote(updated.firebaseUid, fullVote);
        }
      }
    },
    []
  );

  // Update last path
  const updateLastPath = useCallback((path: string) => {
    const current = readSession();
    if (current) {
      const updated = { ...current, lastPath: path, updatedAt: Date.now() };
      setSession(updated);
      writeSession(updated);
    }
  }, []);

  // Force sync
  const syncPendingData = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!session?.firebaseUid || !session.pendingSync) {
      return { success: true }; // Nothing to sync
    }

    const provider = getAuthProvider();
    const result = await provider.syncToBackend(session);

    if (result.success) {
      clearPendingSync();
      const synced = markAsSynced(session.firebaseUid);
      if (synced) setSession(synced);
      return { success: true };
    }

    recordSyncFailure();
    return { success: false, error: result.error };
  }, [session]);

  // Derived state
  const isAuthenticated = session?.status === 'registered' || session?.status === 'synced';
  const isGuest = session?.status === 'guest';
  const role = session?.profile.role ?? null;

  const value: AuthContextValue = {
    loading,
    session,
    isAuthenticated,
    isGuest,
    role,
    startGuestSession,
    register,
    login,
    logout,
    updateProfile,
    recordVote,
    updateLastPath,
    syncPendingData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within MixologyAuthProvider');
  }
  return context;
}

/**
 * Merge votes from two sources, preferring newer timestamps
 */
function mergeVotes(local: UserVote[], remote: UserVote[]): UserVote[] {
  const merged = new Map<string, UserVote>();

  // Add remote votes first
  for (const vote of remote) {
    const key = `${vote.contestId}:${vote.drinkId}`;
    merged.set(key, vote);
  }

  // Override with local votes if newer
  for (const vote of local) {
    const key = `${vote.contestId}:${vote.drinkId}`;
    const existing = merged.get(key);
    if (!existing || vote.timestamp > existing.timestamp) {
      merged.set(key, vote);
    }
  }

  return Array.from(merged.values());
}
