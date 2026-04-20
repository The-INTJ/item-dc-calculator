/**
 * Auth provider interface for Firebase authentication.
 *
 * Covers Firebase Auth SDK operations only — user profile reads/writes live
 * behind the `/api/contest/auth/*` routes and are not part of this contract.
 */

import type { RegistrationData, LoginCredentials } from './types';

export interface AuthResult {
  success: boolean;
  error?: string;
  uid?: string;
}

/** Event fired when the Firebase ID token changes (sign-in, sign-out, refresh). */
export interface IdTokenChange {
  /** Current uid, or null if signed out. */
  uid: string | null;
  /** Freshly refreshed ID token, or null if signed out. */
  idToken: string | null;
}

/** Unsubscribe function returned from `onIdTokenChanged`. */
export type UnsubscribeFn = () => void;

export interface AuthProvider {
  readonly name: string;
  initialize(): Promise<void>;
  register(data: RegistrationData): Promise<AuthResult>;
  login(credentials: LoginCredentials): Promise<AuthResult>;
  loginWithGoogle(): Promise<AuthResult>;
  loginAnonymously(): Promise<AuthResult>;
  logout(): Promise<AuthResult>;
  isAuthenticated(): boolean;
  getCurrentUid(): string | null;
  getCurrentEmail(): string | null;
  getCurrentDisplayName(): string | null;
  getIdToken(): Promise<string | null>;
  /**
   * Subscribe to ID token changes (sign-in / sign-out / hourly refresh).
   * Used by the session-cookie bridge to keep the `__session` cookie fresh.
   */
  onIdTokenChanged(listener: (change: IdTokenChange) => void): UnsubscribeFn;
}
