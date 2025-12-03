/**
 * Auth module index
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
} from './types';

// Context and hooks
export { MixologyAuthProvider, useAuth } from './AuthContext';

// Storage utilities (for advanced use cases)
export {
  readSession,
  writeSession,
  clearSession,
  createGuestSession,
} from './storage';

// Provider interface (for implementing custom backends)
export type { AuthProvider, AuthResult } from './provider';
