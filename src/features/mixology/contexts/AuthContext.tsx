'use client';

/**
 * Auth context and provider for Mixology - Cloud-first approach.
 *
 * Manages user sessions and authentication state.
 * All data (votes, profiles) is stored in and fetched from Firestore.
 * Firebase Auth handles token persistence automatically.
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
} from '../lib/auth/types';
import type { AuthProvider } from '../lib/auth/provider';
import { createGuestSession, createCloudSession } from '../lib/auth/storage';
import { getInviteContextCookie, setInviteContextCookie, clearInviteContext } from '../lib/auth/cookies';
import { createFirebaseAuthProvider } from '../server/firebase/firebaseAuthProvider';
import { isFirebaseConfigured } from '../server/firebase/config';

// Create context with undefined default (must be used within provider)
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Singleton auth provider - using Firebase
let authProvider: AuthProvider | null = null;

function getAuthProvider(): AuthProvider {
  if (!authProvider) {
    if (!isFirebaseConfigured()) {
      throw new Error('[Auth] Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_* environment variables.');
    }
    authProvider = createFirebaseAuthProvider();
  }
  return authProvider;
}

/**
 * Get the current user's ID token for API authorization.
 * Returns null if not authenticated.
 */
export async function getAuthToken(): Promise<string | null> {
  if (!authProvider) return null;
  return authProvider.getIdToken();
}

interface AuthProviderProps {
  children: ReactNode;
}

export function MixologyAuthProvider({ children }: AuthProviderProps) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<LocalSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize - fetch from cloud only
  useEffect(() => {
    const init = async () => {
      try {
        const provider = getAuthProvider();
        await provider.initialize();

        const currentUid = provider.getCurrentUid();

        if (currentUid) {
          // Fetch user data from Firestore
          try {
            const userData = await provider.fetchUserData(currentUid);
            const inviteContext = getInviteContextCookie() ?? undefined;
            
            const cloudSession = createCloudSession({
              firebaseUid: currentUid,
              profile: userData?.profile ?? {
                displayName: 'Mixology User',
                role: 'viewer',
              },
              inviteContext,
            });

            setSession(cloudSession);
            setError(null);
          } catch (err) {
            console.error('[Auth] Failed to fetch user data from cloud:', err);
            setError('Unable to load user data from cloud. Please check your connection.');
          }
        }
      } catch (error) {
        console.error('[Auth] Failed to initialize auth provider:', error);
        setError('Unable to initialize authentication. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  // Start guest session with Firebase anonymous auth
  const startGuestSession = useCallback(
    async (options?: {
      displayName?: string;
      inviteContext?: InviteContext;
    }): Promise<GuestSessionResult> => {
      const trimmedName = options?.displayName?.trim();
      if (!trimmedName) {
        return {
          success: false,
          syncedToFirestore: false,
          error: 'Display name is required',
        };
      }

      if (options?.inviteContext) {
        setInviteContextCookie(options.inviteContext);
      }

      const provider = getAuthProvider();
      const result = await provider.loginAnonymously();

      if (!result.success || !result.uid) {
        return {
          success: false,
          syncedToFirestore: false,
          error: result.error ?? 'Failed to create guest session',
        };
      }

      // Create session in Firestore immediately
      try {
        await provider.updateProfile(result.uid, { displayName: trimmedName });
        
        const guestSession = createCloudSession({
          firebaseUid: result.uid,
          profile: {
            displayName: trimmedName,
            role: 'viewer',
          },
          inviteContext: options?.inviteContext,
        });

        setSession(guestSession);
        setError(null);

        return {
          success: true,
          syncedToFirestore: true,
        };
      } catch (err) {
        console.error('[Auth] Failed to sync guest session to Firestore:', err);
        setError('Guest session created but failed to sync to cloud');
        return {
          success: true,
          syncedToFirestore: false,
          error: 'Cloud sync failed',
        };
      }
    },
    []
  );

  const applyInviteContext = useCallback((inviteContext: InviteContext) => {
    setInviteContextCookie(inviteContext);
    if (session) {
      setSession({ ...session, inviteContext });
    }
  }, [session]);

  // Register new account
  const register = useCallback(
    async (data: RegistrationData): Promise<{ success: boolean; error?: string }> => {
      const provider = getAuthProvider();
      const result = await provider.register(data);

      if (!result.success || !result.uid) {
        return { success: false, error: result.error };
      }

      // Create cloud session
      try {
        const cloudSession = createCloudSession({
          firebaseUid: result.uid,
          profile: {
            displayName: data.displayName,
            email: data.email,
            role: 'viewer',
          },
          inviteContext: session?.inviteContext,
        });

        setSession(cloudSession);
        setError(null);
        return { success: true };
      } catch (err) {
        console.error('[Auth] Failed to create session after registration:', err);
        setError('Account created but failed to initialize session');
        return { success: false, error: 'Failed to initialize session' };
      }
    },
    [session]
  );

  // Login
  const login = useCallback(
    async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
      const provider = getAuthProvider();
      const result = await provider.login(credentials);

      if (!result.success || !result.uid) {
        return { success: false, error: result.error };
      }

      try {
        const userData = await provider.fetchUserData(result.uid);
        const cloudSession = createCloudSession({
          firebaseUid: result.uid,
          profile: userData?.profile ?? {
            displayName: credentials.email.split('@')[0],
            email: credentials.email,
            role: 'viewer',
          },
          inviteContext: getInviteContextCookie() ?? undefined,
        });

        setSession(cloudSession);
        setError(null);
        return { success: true };
      } catch (err) {
        console.error('[Auth] Failed to fetch user data after login:', err);
        setError('Logged in but failed to load user data from cloud');
        return { success: false, error: 'Failed to load user data' };
      }
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

      try {
        const userData = await provider.fetchUserData(result.uid);
        const cloudSession = createCloudSession({
          firebaseUid: result.uid,
          profile: userData?.profile ?? {
            displayName: 'Google User',
            role: 'viewer',
          },
          inviteContext: getInviteContextCookie() ?? undefined,
        });

        setSession(cloudSession);
        setError(null);
        return { success: true };
      } catch (err) {
        console.error('[Auth] Failed to fetch user data after Google login:', err);
        setError('Logged in but failed to load user data from cloud');
        return { success: false, error: 'Failed to load user data' };
      }
    },
    []
  );

  const loginAnonymously = useCallback(
    async (options?: {
      displayName?: string;
      inviteContext?: InviteContext;
    }): Promise<{ success: boolean; error?: string }> => {
      return startGuestSession(options);
    },
    [startGuestSession]
  );

  // Logout
  const logout = useCallback(async () => {
    const provider = getAuthProvider();
    await provider.logout();

    clearInviteContext();
    setSession(null);
    setError(null);
  }, []);

  const resetSessionForNewAccount = useCallback(async () => {
    const provider = getAuthProvider();
    if (provider.isAuthenticated()) {
      await provider.logout();
    }

    clearInviteContext();
    setSession(null);
    setError(null);
  }, []);

  // Update profile - saves to Firestore only
  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      if (!session?.firebaseUid) {
        setError('No active session');
        return;
      }

      try {
        const provider = getAuthProvider();
        await provider.updateProfile(session.firebaseUid, updates);

        // Update local session state
        setSession({
          ...session,
          profile: { ...session.profile, ...updates },
          updatedAt: Date.now(),
        });
        setError(null);
      } catch (err) {
        console.error('[Auth] Failed to update profile:', err);
        setError('Failed to update profile in cloud');
      }
    },
    [session]
  );

  // Record vote - saves to Firestore only
  const recordVote = useCallback(
    async (vote: Omit<UserVote, 'timestamp'>) => {
      if (!session?.firebaseUid) {
        setError('No active session');
        return;
      }

      try {
        const provider = getAuthProvider();
        const fullVote: UserVote = { ...vote, timestamp: Date.now() };
        await provider.saveVote(session.firebaseUid, fullVote);

        // Update local session state optimistically
        setSession({
          ...session,
          votes: [...session.votes, fullVote],
          updatedAt: Date.now(),
        });
        setError(null);
      } catch (err) {
        console.error('[Auth] Failed to save vote:', err);
        setError('Failed to save vote to cloud');
      }
    },
    [session]
  );

  // Update last path - in-memory only, not persisted
  const updateLastPath = useCallback((path: string) => {
    if (session) {
      setSession({ ...session, lastPath: path, updatedAt: Date.now() });
    }
  }, [session]);

  // No pending sync in cloud-only mode
  const syncPendingData = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    return { success: true }; // No-op in cloud-only mode
  }, []);

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
    error,
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
