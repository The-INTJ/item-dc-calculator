'use client';

import { createContext, useContext } from 'react';
import type { AuthContextValue, AuthProviderProps } from './types';
import type { AuthProvider as AuthProviderContract } from './provider';
import { useAuthReducer } from './useAuthReducer';
import { useAuthInit } from './useAuthInit';
import { useAuthActions } from './useAuthActions';
import { createFirebaseAuthProvider } from '../../lib/firebase/firebaseAuthProvider';
import { isFirebaseConfigured } from '../../lib/firebase/config';

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

  const {
    startGuestSession,
    register,
    login,
    loginWithGoogle,
    upgradeGuestWithEmail,
    upgradeGuestWithGoogle,
    logout,
    updateProfile,
    resetSessionForNewAccount,
  } = useAuthActions(provider, session, dispatch);

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
    upgradeGuestWithEmail,
    upgradeGuestWithGoogle,
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
