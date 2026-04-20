'use client';

import { createContext, useContext } from 'react';
import type {
  AuthContextValue,
  AuthProviderProps,
  RegistrationData,
  LoginCredentials,
  UserProfile,
  GuestSessionResult,
  AuthResult,
} from './types';
import type { AuthProvider as AuthProviderContract } from './provider';
import { createSession } from './storage';
import { useAuthReducer } from './useAuthReducer';
import { useAuthInit } from './useAuthInit';
import { clearSessionCookie } from './sessionSync';
import { createFirebaseAuthProvider } from '../../lib/firebase/firebaseAuthProvider';
import { isFirebaseConfigured } from '../../lib/firebase/config';
import { contestApi } from '../../lib/api/contestApi';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

let authProvider: AuthProviderContract | null = null;

function getAuthProvider(): AuthProviderContract {
  if (!authProvider) {
    if (!isFirebaseConfigured()) {
      throw new Error('[Auth] Firebase not configured');
    }
    authProvider = createFirebaseAuthProvider();
  }
  return authProvider;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useAuthReducer();
  const provider = getAuthProvider();

  useAuthInit({ provider, dispatch });

  const session = state.status === 'authenticated' || state.status === 'guest' ? state.session : null;
  const loading = state.status === 'loading';
  const error = state.status === 'error' ? state.message : null;

  async function startGuestSession(displayName: string): Promise<GuestSessionResult> {
    const trimmed = displayName.trim();
    if (!trimmed) {
      return { success: false, syncedToFirestore: false, error: 'Display name required' };
    }

    const result = await provider.loginAnonymously();
    if (!result.success || !result.uid) {
      return { success: false, syncedToFirestore: false, error: result.error ?? 'Failed to create guest session' };
    }

    const created = await contestApi.registerProfile({ displayName: trimmed });
    const guestSession = createSession({
      firebaseUid: result.uid,
      profile: created.success && created.data
        ? created.data
        : { displayName: trimmed, role: 'voter' },
      status: 'guest',
    });
    dispatch({ type: 'GUEST', session: guestSession });
    return { success: true, syncedToFirestore: created.success };
  }

  async function register(data: RegistrationData): Promise<AuthResult> {
    const result = await provider.register(data);
    if (!result.success || !result.uid) {
      return { success: false, error: result.error };
    }

    const created = await contestApi.registerProfile({
      displayName: data.displayName,
      email: data.email,
    });
    const newSession = createSession({
      firebaseUid: result.uid,
      profile: created.success && created.data
        ? created.data
        : { displayName: data.displayName, email: data.email, role: 'voter' },
    });
    dispatch({ type: 'AUTHENTICATED', session: newSession });
    return { success: true };
  }

  async function resolveProfileOrCreate(
    fallbackEmail?: string,
    fallbackDisplayName?: string,
  ): Promise<UserProfile> {
    const existing = await contestApi.getProfile();
    if (existing.success && existing.data) return existing.data;

    const created = await contestApi.registerProfile({
      displayName: fallbackDisplayName,
      email: fallbackEmail,
    });
    if (created.success && created.data) return created.data;

    return {
      displayName: fallbackDisplayName ?? fallbackEmail?.split('@')[0] ?? 'Contest User',
      email: fallbackEmail,
      role: 'voter',
    };
  }

  async function login(credentials: LoginCredentials): Promise<AuthResult> {
    const result = await provider.login(credentials);
    if (!result.success || !result.uid) {
      return { success: false, error: result.error };
    }

    const profile = await resolveProfileOrCreate(
      credentials.email,
      credentials.email.split('@')[0],
    );
    const newSession = createSession({ firebaseUid: result.uid, profile });
    dispatch({ type: 'AUTHENTICATED', session: newSession });
    return { success: true };
  }

  async function loginWithGoogle(): Promise<AuthResult> {
    const result = await provider.loginWithGoogle();
    if (!result.success || !result.uid) {
      return { success: false, error: result.error };
    }

    const profile = await resolveProfileOrCreate(
      provider.getCurrentEmail() ?? undefined,
      provider.getCurrentDisplayName() ?? 'Google User',
    );
    const newSession = createSession({ firebaseUid: result.uid, profile });
    dispatch({ type: 'AUTHENTICATED', session: newSession });
    return { success: true };
  }

  async function logout(): Promise<void> {
    // Clear the server-side session cookie before tearing down the client auth
    // state — once Firebase signs the user out, `fetchWithAuth` won't have a
    // Bearer token to authenticate the DELETE.
    await clearSessionCookie();
    await provider.logout();
    dispatch({ type: 'LOGOUT' });
  }

  async function resetSessionForNewAccount(): Promise<void> {
    if (provider.isAuthenticated()) {
      await clearSessionCookie();
      await provider.logout();
    }
    dispatch({ type: 'LOGOUT' });
  }

  async function updateProfile(updates: Partial<UserProfile>): Promise<void> {
    if (!session?.firebaseUid) return;
    const allowedUpdates: Partial<Pick<UserProfile, 'displayName' | 'avatarUrl'>> = {};
    if (updates.displayName !== undefined) allowedUpdates.displayName = updates.displayName;
    if (updates.avatarUrl !== undefined) allowedUpdates.avatarUrl = updates.avatarUrl;

    const result = await contestApi.updateProfile(allowedUpdates);
    dispatch({
      type: 'UPDATE_SESSION',
      session: {
        ...session,
        profile: result.success && result.data ? result.data : { ...session.profile, ...allowedUpdates },
        updatedAt: Date.now(),
      },
    });
  }

  const value: AuthContextValue = {
    loading,
    session,
    isAuthenticated: state.status === 'authenticated',
    isGuest: state.status === 'guest',
    role: session?.profile.role ?? null,
    error,
    startGuestSession,
    register,
    login,
    loginWithGoogle,
    logout,
    updateProfile,
    resetSessionForNewAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
