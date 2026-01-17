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
  InviteContext,
  LocalSession,
  RegistrationData,
  LoginCredentials,
  UserProfile,
  UserVote,
  GuestSessionResult,
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
  setInviteContext,
  clearSession,
} from './storage';
import {
  clearGuestIdentity,
  ensureGuestIdentity,
  getInviteContextCookie,
  setInviteContextCookie,
} from './cookies';
import { registerGuestIdentity } from '../firebase/guest';
import { createMockAuthProvider } from './mockAuthProvider';
import { createFirebaseAuthProvider } from '../firebase/firebaseAuthProvider';
import { isFirebaseConfigured } from '../firebase/config';

// Create context with undefined default (must be used within provider)
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Singleton auth provider - using Firebase
let authProvider: AuthProvider | null = null;

function getAuthProvider(): AuthProvider {
  if (!authProvider) {
    if (isFirebaseConfigured()) {
      authProvider = createFirebaseAuthProvider();
    } else {
      console.warn('[Auth] Firebase not configured; using local-only auth provider.');
      authProvider = createMockAuthProvider();
    }
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

      const existingSession = readSession();
      const currentUid = provider.getCurrentUid();

      const hydrateSessionFromBackend = async (
        uid: string,
        baseSession?: LocalSession | null
      ): Promise<LocalSession> => {
        const userData = await provider.fetchUserData(uid);
        const now = Date.now();
        const shouldMergeLocal = !baseSession?.firebaseUid || baseSession.firebaseUid === uid;
        const localVotes = shouldMergeLocal ? baseSession?.votes ?? [] : [];
        const localProfile = shouldMergeLocal ? baseSession?.profile : undefined;
        const localInvite = shouldMergeLocal ? baseSession?.inviteContext : undefined;
        const localGuestIdentity = shouldMergeLocal ? baseSession?.guestIdentity : undefined;

        const merged: LocalSession = {
          sessionId: baseSession?.sessionId ?? `sess_${now}`,
          status: 'synced',
          firebaseUid: uid,
          profile: {
            displayName:
              localProfile?.displayName ??
              userData?.profile?.displayName ??
              userData?.profile?.email?.split('@')[0] ??
              'Mixology User',
            email: localProfile?.email ?? userData?.profile?.email,
            role: userData?.profile?.role ?? localProfile?.role ?? 'viewer',
          },
          votes: mergeVotes(localVotes, userData?.votes ?? []),
          createdAt: baseSession?.createdAt ?? now,
          updatedAt: now,
          inviteContext: localInvite ?? getInviteContextCookie() ?? undefined,
          guestIdentity: localGuestIdentity,
        };

        writeSession(merged);
        return merged;
      };

      if (existingSession) {
        setSession(existingSession);

        if (currentUid) {
          const needsRefresh = existingSession.firebaseUid !== currentUid;
          const refreshed = await hydrateSessionFromBackend(
            currentUid,
            needsRefresh ? null : existingSession
          );
          setSession(refreshed);
        } else if (existingSession.firebaseUid && provider.isAuthenticated()) {
          const refreshed = await hydrateSessionFromBackend(existingSession.firebaseUid, existingSession);
          setSession(refreshed);
        }
      } else if (currentUid) {
        const refreshed = await hydrateSessionFromBackend(currentUid, null);
        setSession(refreshed);
      }

      setLoading(false);
    };

    init();
  }, []);

  // Start guest session with Firestore fallback
  const startGuestSession = useCallback(
    async (options?: {
      displayName?: string;
      inviteContext?: InviteContext;
    }): Promise<GuestSessionResult> => {
      const identity = ensureGuestIdentity(true);
      const newSession = createGuestSession({
        displayName: options?.displayName,
        guestId: identity.guestId,
        guestIndex: identity.guestIndex,
        inviteContext: options?.inviteContext,
      });

      if (options?.inviteContext) {
        setInviteContextCookie(options.inviteContext);
      }

      // Attempt Firestore registration with graceful fallback
      const result = await registerGuestIdentity(
        identity.guestId,
        options?.inviteContext,
        options?.displayName
      );

      // Session is saved regardless of Firestore success
      setSession(newSession);
      writeSession(newSession);

      return {
        success: true,
        syncedToFirestore: result.syncedToFirestore,
        error: result.error,
      };
    },
    []
  );

  const applyInviteContext = useCallback((inviteContext: InviteContext) => {
    setInviteContextCookie(inviteContext);
    const updated = setInviteContext(inviteContext);
    if (updated) setSession(updated);
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
        inviteContext: currentLocal?.inviteContext,
        guestIdentity: currentLocal?.guestIdentity,
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

  const loginWithGoogle = useCallback(
    async (): Promise<{ success: boolean; error?: string }> => {
      const provider = getAuthProvider();
      const result = await provider.loginWithGoogle();

      if (!result.success || !result.uid) {
        return { success: false, error: result.error };
      }

      const userData = await provider.fetchUserData(result.uid);
      const currentLocal = readSession();

      const newSession: LocalSession = {
        sessionId: currentLocal?.sessionId ?? `sess_${Date.now()}`,
        status: 'synced',
        firebaseUid: result.uid,
        profile: userData?.profile ?? {
          displayName: 'Mixology User',
          role: 'viewer',
        },
        votes: userData?.votes ?? [],
        createdAt: currentLocal?.createdAt ?? Date.now(),
        updatedAt: Date.now(),
        inviteContext: currentLocal?.inviteContext,
        guestIdentity: currentLocal?.guestIdentity,
      };

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

  const loginAnonymously = useCallback(
    async (options?: {
      displayName?: string;
      inviteContext?: InviteContext;
    }): Promise<{ success: boolean; error?: string }> => {
      const trimmedName = options?.displayName?.trim();
      if (!trimmedName) {
        return { success: false, error: 'Display name is required to continue as guest.' };
      }

      const provider = getAuthProvider();
      const result = await provider.loginAnonymously();

      if (!result.success || !result.uid) {
        return { success: false, error: result.error };
      }

      if (options?.inviteContext) {
        setInviteContextCookie(options.inviteContext);
      }

      const userData = await provider.fetchUserData(result.uid);
      const currentLocal = readSession();
      const resolvedInvite = options?.inviteContext ?? currentLocal?.inviteContext;

      const fallbackDisplayName = trimmedName;

      const newSession: LocalSession = {
        sessionId: currentLocal?.sessionId ?? `sess_${Date.now()}`,
        status: 'synced',
        firebaseUid: result.uid,
        profile: userData?.profile ?? {
          displayName: fallbackDisplayName,
          role: 'viewer',
        },
        votes: userData?.votes ?? [],
        createdAt: currentLocal?.createdAt ?? Date.now(),
        updatedAt: Date.now(),
        inviteContext: resolvedInvite,
        guestIdentity: currentLocal?.guestIdentity,
      };

      if (currentLocal && currentLocal.status === 'guest' && currentLocal.votes.length > 0) {
        for (const vote of currentLocal.votes) {
          await provider.saveVote(result.uid, vote);
        }
        newSession.votes = mergeVotes(newSession.votes, currentLocal.votes);
      }

      setSession(newSession);
      writeSession(newSession);

      if (trimmedName) {
        await provider.updateProfile(result.uid, { displayName: trimmedName });
        const updated = updateProfileInSession({ displayName: trimmedName });
        if (updated) setSession(updated);
      }

      return { success: true };
    },
    []
  );

  // Logout
  const logout = useCallback(async () => {
    const provider = getAuthProvider();
    await provider.logout();

    clearSession();
    clearGuestIdentity();
    setSession(null);
  }, []);

  const resetSessionForNewAccount = useCallback(async () => {
    const provider = getAuthProvider();
    if (provider.isAuthenticated()) {
      await provider.logout();
    }

    clearSession();
    clearGuestIdentity();
    setInviteContextCookie(null);
    setSession(null);
  }, []);

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
    loginWithGoogle,
    loginAnonymously,
    logout,
    updateProfile,
    recordVote,
    updateLastPath,
    syncPendingData,
    applyInviteContext,
    resetSessionForNewAccount,
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
