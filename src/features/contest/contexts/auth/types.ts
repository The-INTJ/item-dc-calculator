/**
 * Auth types for Mixology - Cloud-first.
 */

import type { ReactNode } from 'react';
import type { UserRole } from '../contest/contestTypes';

// ─────────────────────────────────────────────────────────────────────────────
// Core Types
// ─────────────────────────────────────────────────────────────────────────────

export type UserStatus = 'guest' | 'authenticated';

export interface UserProfile {
  displayName: string;
  email?: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface Session {
  sessionId: string;
  status: UserStatus;
  firebaseUid: string;
  profile: UserProfile;
  createdAt: number;
  updatedAt: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth State (Reducer)
// ─────────────────────────────────────────────────────────────────────────────

export type AuthStatus = 'loading' | 'authenticated' | 'guest' | 'unauthenticated' | 'error';

export type AuthState =
  | { status: 'loading' }
  | { status: 'authenticated'; session: Session }
  | { status: 'guest'; session: Session }
  | { status: 'unauthenticated' }
  | { status: 'error'; message: string };

export type AuthAction =
  | { type: 'LOADING' }
  | { type: 'AUTHENTICATED'; session: Session }
  | { type: 'GUEST'; session: Session }
  | { type: 'ERROR'; message: string }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_SESSION'; session: Session };

// ─────────────────────────────────────────────────────────────────────────────
// Auth Flow Types
// ─────────────────────────────────────────────────────────────────────────────

export interface RegistrationData {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
}

export interface GuestSessionResult extends AuthResult {
  syncedToFirestore: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Context Value
// ─────────────────────────────────────────────────────────────────────────────

export interface AuthContextValue {
  // State
  loading: boolean;
  session: Session | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  role: UserRole | null;
  error: string | null;

  // Actions
  startGuestSession: (displayName: string) => Promise<GuestSessionResult>;
  register: (data: RegistrationData) => Promise<AuthResult>;
  login: (credentials: LoginCredentials) => Promise<AuthResult>;
  loginWithGoogle: () => Promise<AuthResult>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  resetSessionForNewAccount: () => Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component Props
// ─────────────────────────────────────────────────────────────────────────────

export interface AuthProviderProps {
  children: ReactNode;
}
