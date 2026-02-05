/**
 * Auth provider interface for Firebase authentication.
 */

import type { LocalSession, RegistrationData, LoginCredentials, UserProfile, UserVote } from './types';

/**
 * Result of an auth operation
 */
export interface AuthResult {
  success: boolean;
  error?: string;
  uid?: string;
}

/**
 * Auth provider interface
 */
export interface AuthProvider {
  readonly name: string;

  /**
   * Initialize the auth provider
   */
  initialize(): Promise<void>;

  /**
   * Register a new user
   */
  register(data: RegistrationData): Promise<AuthResult>;

  /**
   * Log in an existing user
   */
  login(credentials: LoginCredentials): Promise<AuthResult>;

  /**
   * Log in with Google OAuth
   */
  loginWithGoogle(): Promise<AuthResult>;

  /**
   * Log in anonymously with Firebase Auth
   */
  loginAnonymously(): Promise<AuthResult>;

  /**
   * Log out the current user
   */
  logout(): Promise<AuthResult>;

  /**
   * Check if user is currently authenticated with the backend
   */
  isAuthenticated(): boolean;

  /**
   * Get current user's Firebase UID
   */
  getCurrentUid(): string | null;

  /**
   * Sync local data to the backend
   */
  syncToBackend(session: LocalSession): Promise<AuthResult>;

  /**
   * Fetch user data from backend
   */
  fetchUserData(uid: string): Promise<{ profile?: UserProfile; votes?: UserVote[] } | null>;

  /**
   * Save a vote to the backend
   */
  saveVote(uid: string, vote: UserVote): Promise<AuthResult>;

  /**
   * Update profile on the backend
   */
  updateProfile(uid: string, updates: Partial<UserProfile>): Promise<AuthResult>;

  /**
   * Get the current user's ID token for API authorization
   */
  getIdToken(): Promise<string | null>;
}
