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
}
