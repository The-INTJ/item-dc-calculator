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
  LocalSession,
  RegistrationData,
  LoginCredentials,
  UserProfile,
  UserVote,
  GuestSessionResult,
} from './auth/types';
import type { AuthProvider } from './auth/provider';
import { createGuestSession, createCloudSession } from './auth/storage';
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

// WTD - This is a useless wrapper; remove
/**
 * Get the current user's ID token for API authorization.
 * Returns null if not authenticated.
 */
export async function getAuthToken(): Promise<string | null> {
  if (!authProvider) return null;
  return authProvider.getIdToken();
}

// WTD - do not initialize any types outside type files or in the middle of files
interface AuthProviderProps {
  children: ReactNode;
}

export function MixologyAuthProvider({ children }: AuthProviderProps) {

  /* WTD Replace all the useState with useReducer for better state management
  I want types defined in the type file
  type AuthState =
  | { status: 'loading' }
  | { status: 'authenticated'; session: LocalSession }
  | { status: 'error'; message: string }
  | { status: 'guest' };

type AuthAction =
  | { type: 'LOADING' }
  | { type: 'SUCCESS'; session: LocalSession }
  | { type: 'ERROR'; message: string }
  | { type: 'LOGOUT' };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOADING':
      return { status: 'loading' };

    case 'SUCCESS':
      return { status: 'authenticated', session: action.session };

    case 'ERROR':
      return { status: 'error', message: action.message };

    case 'LOGOUT':
      return { status: 'guest' };
  }
}
  */
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<LocalSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize - fetch from cloud only
  // WTD - extract into custom hook in one of the sub files in the new folder
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
            
            const cloudSession = createCloudSession({
              firebaseUid: currentUid,
              profile: userData?.profile ?? {
                displayName: 'Mixology User',
                role: 'viewer',
              },
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
  // WTD - we must flatten + abstract + extract
  // 1. Don't use a callback unless you can give me a good reason to. recall, react 19 automatically memoizes functions in many cases
  // 2. early return if the name is wrong is good
  // 3. IMPORTANT -- we do a "create session in firestore". This is something that should be abstracted into a util method. For example, I'm pretty certain we call this for the normal, non-guest session as well. So we should have a "createSession" method that handles this logic
  // Of note: the create session method should do the error handeling; that's the main abstraction. Our intent is for someone reading the code
  // to be able to read "create session" and understand what it does without getting bogged down in the details of error handeling
  const startGuestSession = useCallback(
    async (options?: {
      displayName?: string;
    }): Promise<GuestSessionResult> => {
      const trimmedName = options?.displayName?.trim();
      if (!trimmedName) {
        return {
          success: false,
          syncedToFirestore: false,
          error: 'Display name is required',
        };
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

  // Register new account
  // WTD - ok just like above, this logic and the ending logic of the last function should be abstracted into a "createSession" method
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
    []
  );

  // Login
  // WTD - use the session creation if valid
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

  // WTD - the create session logic will need solid, robust typing. I want enums, etc, so our flows are crystal clear
  // we should only need guest and google in the method I think
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
    }): Promise<{ success: boolean; error?: string }> => {
      return startGuestSession(options);
    },
    [startGuestSession]
  );

  // Logout
  const logout = useCallback(async () => {
    const provider = getAuthProvider();
    await provider.logout();

    setSession(null);
    setError(null);
  }, []);

  const resetSessionForNewAccount = useCallback(async () => {
    const provider = getAuthProvider();
    if (provider.isAuthenticated()) {
      await provider.logout();
    }

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

        // WTD - pretty sure we got rid of local session like this; our context holds the session
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

  // WTD - no callback unless you see a solid reason
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

  // WTD -- why are we saving the last visited page? Browser history should handle this
  // Update last path - in-memory only, not persisted
  const updateLastPath = useCallback((path: string) => {
    if (session) {
      setSession({ ...session, lastPath: path, updatedAt: Date.now() });
    }
  }, [session]);

  // Remove this method and anything that uses it, this is useless
  // No pending sync in cloud-only mode
  const syncPendingData = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    return { success: true }; // No-op in cloud-only mode
  }, []);

  // WTD -- don't think "synced" is valid anymore? check this
  // Our only roles should be user and admin
  // role is only part of contest state, not auth
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
