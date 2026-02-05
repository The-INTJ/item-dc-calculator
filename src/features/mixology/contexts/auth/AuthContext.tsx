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
import type { AuthProvider } from './provider';
import { createSession } from './storage';
import { useAuthReducer } from './useAuthReducer';
import { useAuthInit } from './useAuthInit';
import { createFirebaseAuthProvider } from '../../lib/firebase/firebaseAuthProvider';
import { isFirebaseConfigured } from '../../lib/firebase/config';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

let authProvider: AuthProvider | null = null;

function getAuthProvider(): AuthProvider {
  if (!authProvider) {
    if (!isFirebaseConfigured()) {
      throw new Error('[Auth] Firebase not configured');
    }
    authProvider = createFirebaseAuthProvider();
  }
  return authProvider;
}

export function MixologyAuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useAuthReducer();
  const provider = getAuthProvider();

  useAuthInit({ provider, dispatch });

  // Derived state
  const session = state.status === 'authenticated' || state.status === 'guest' ? state.session : null;
  const loading = state.status === 'loading';
  const error = state.status === 'error' ? state.message : null;

  // ─────────────────────────────────────────────────────────────────────────────
  // Actions
  // ─────────────────────────────────────────────────────────────────────────────

  async function startGuestSession(displayName: string): Promise<GuestSessionResult> {
    const trimmed = displayName.trim();
    if (!trimmed) {
      return { success: false, syncedToFirestore: false, error: 'Display name required' };
    }

    const result = await provider.loginAnonymously();
    if (!result.success || !result.uid) {
      return { success: false, syncedToFirestore: false, error: result.error ?? 'Failed to create guest session' };
    }

    try {
      await provider.updateProfile(result.uid, { displayName: trimmed });
      const guestSession = createSession({
        firebaseUid: result.uid,
        profile: { displayName: trimmed, role: 'viewer' },
        status: 'guest',
      });
      dispatch({ type: 'GUEST', session: guestSession });
      return { success: true, syncedToFirestore: true };
    } catch (err) {
      console.error('[Auth] Guest session sync failed:', err);
      return { success: true, syncedToFirestore: false, error: 'Cloud sync failed' };
    }
  }

  async function register(data: RegistrationData): Promise<AuthResult> {
    const result = await provider.register(data);
    if (!result.success || !result.uid) {
      return { success: false, error: result.error };
    }

    const newSession = createSession({
      firebaseUid: result.uid,
      profile: { displayName: data.displayName, email: data.email, role: 'viewer' },
    });
    dispatch({ type: 'AUTHENTICATED', session: newSession });
    return { success: true };
  }

  async function login(credentials: LoginCredentials): Promise<AuthResult> {
    const result = await provider.login(credentials);
    if (!result.success || !result.uid) {
      return { success: false, error: result.error };
    }

    const userData = await provider.fetchUserData(result.uid);
    const newSession = createSession({
      firebaseUid: result.uid,
      profile: userData?.profile ?? {
        displayName: credentials.email.split('@')[0],
        email: credentials.email,
        role: 'viewer',
      },
    });
    dispatch({ type: 'AUTHENTICATED', session: newSession });
    return { success: true };
  }

  async function loginWithGoogle(): Promise<AuthResult> {
    const result = await provider.loginWithGoogle();
    if (!result.success || !result.uid) {
      return { success: false, error: result.error };
    }

    const userData = await provider.fetchUserData(result.uid);
    const newSession = createSession({
      firebaseUid: result.uid,
      profile: userData?.profile ?? { displayName: 'Google User', role: 'viewer' },
    });
    dispatch({ type: 'AUTHENTICATED', session: newSession });
    return { success: true };
  }

  async function logout(): Promise<void> {
    await provider.logout();
    dispatch({ type: 'LOGOUT' });
  }

  async function resetSessionForNewAccount(): Promise<void> {
    if (provider.isAuthenticated()) {
      await provider.logout();
    }
    dispatch({ type: 'LOGOUT' });
  }

  async function updateProfile(updates: Partial<UserProfile>): Promise<void> {
    if (!session?.firebaseUid) return;
    await provider.updateProfile(session.firebaseUid, updates);
    dispatch({
      type: 'UPDATE_SESSION',
      session: { ...session, profile: { ...session.profile, ...updates }, updatedAt: Date.now() },
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
    throw new Error('useAuth must be used within MixologyAuthProvider');
  }
  return context;
}
