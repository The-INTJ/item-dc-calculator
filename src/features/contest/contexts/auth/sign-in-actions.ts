'use client';

import type {
  AuthAction,
  RegistrationData,
  LoginCredentials,
  GuestSessionResult,
  AuthResult,
} from './types';
import type { AuthProvider as AuthProviderContract } from './provider';
import { createSession } from './storage';
import { resolveProfileOrCreate } from './resolve-profile';
import { contestApi } from '../../lib/api/contestApi';

/** The four ways a visitor enters a session: as a guest, or by account. */
export function signInActions(
  provider: AuthProviderContract,
  dispatch: (action: AuthAction) => void,
) {
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

  return { startGuestSession, register, login, loginWithGoogle };
}
