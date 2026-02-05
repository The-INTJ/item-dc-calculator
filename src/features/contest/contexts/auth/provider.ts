/**
 * Auth provider interface for Firebase authentication.
 */

import type { RegistrationData, LoginCredentials, UserProfile } from './types';

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
  fetchUserData(uid: string): Promise<{ profile?: UserProfile } | null>;
  updateProfile(uid: string, updates: Partial<UserProfile>): Promise<AuthResult>;
  getIdToken(): Promise<string | null>;
}
