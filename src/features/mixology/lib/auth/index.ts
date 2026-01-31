/**
 * Auth module index - Cloud-first approach
 */

// Types
export type {
  UserStatus,
  UserVote,
  PendingSync,
  UserProfile,
  LocalSession,
  RegistrationData,
  LoginCredentials,
  AuthState,
  AuthActions,
  AuthContextValue,
  GuestSessionResult,
} from './types';

// Context and hooks - re-export from contexts folder
export { MixologyAuthProvider, useAuth } from '../../contexts/AuthContext';

// Minimal storage utilities (cloud-first)
export { createGuestSession, createCloudSession } from './storage';

// Invite context cookie helpers
export { getInviteContextCookie, setInviteContextCookie, clearInviteContext } from './cookies';

export { parseInviteSearchParams } from './invite';

// Provider interface (for implementing custom backends)
export type { AuthProvider, AuthResult } from './provider';
