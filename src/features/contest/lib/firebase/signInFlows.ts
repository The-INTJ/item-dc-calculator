/**
 * Sign-in, registration, and sign-out flows for the Firebase auth provider.
 *
 * Each flow guards on Firebase configuration and records the resulting user
 * in the shared auth session state.
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  type Auth,
} from 'firebase/auth';

import type { AuthResult } from '../../contexts/auth/provider';
import type { RegistrationData, LoginCredentials } from '../../contexts/auth/types';
import { isFirebaseConfigured } from './config';
import { setSessionUser } from './authSessionUser';
import { syncDisplayNameToAuthProfile } from './authProfileSync';

export async function registerWithEmail(auth: Auth | null, data: RegistrationData): Promise<AuthResult> {
  if (!isFirebaseConfigured() || !auth) {
    return { success: false, error: 'Firebase not configured' };
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    setSessionUser(userCredential.user);
    await syncDisplayNameToAuthProfile(userCredential.user, data.displayName);
    return { success: true, uid: userCredential.user.uid };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    return { success: false, error: message };
  }
}

export async function loginWithEmail(auth: Auth | null, credentials: LoginCredentials): Promise<AuthResult> {
  if (!isFirebaseConfigured() || !auth) {
    return { success: false, error: 'Firebase not configured' };
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
    setSessionUser(userCredential.user);
    return { success: true, uid: userCredential.user.uid };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Login failed';
    return { success: false, error: message };
  }
}

export async function loginWithGooglePopup(auth: Auth | null): Promise<AuthResult> {
  if (!isFirebaseConfigured() || !auth) {
    return { success: false, error: 'Firebase not configured' };
  }

  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    setSessionUser(userCredential.user);
    return { success: true, uid: userCredential.user.uid };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Google sign-in failed';
    return { success: false, error: message };
  }
}

export async function loginAsGuest(auth: Auth | null): Promise<AuthResult> {
  if (!isFirebaseConfigured() || !auth) {
    return { success: false, error: 'Firebase not configured' };
  }

  try {
    const userCredential = await signInAnonymously(auth);
    setSessionUser(userCredential.user);
    return { success: true, uid: userCredential.user.uid };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Anonymous sign-in failed';
    return { success: false, error: message };
  }
}

export async function logoutUser(auth: Auth | null): Promise<AuthResult> {
  if (!isFirebaseConfigured() || !auth) {
    return { success: false, error: 'Firebase not configured' };
  }

  try {
    await signOut(auth);
    setSessionUser(null);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Logout failed';
    return { success: false, error: message };
  }
}
