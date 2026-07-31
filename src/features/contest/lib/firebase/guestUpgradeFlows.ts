/**
 * Guest-upgrade flows: link an anonymous session to email/password or Google
 * credentials so the guest's activity carries over to a real account.
 */

import {
  linkWithCredential,
  linkWithPopup,
  EmailAuthProvider,
  GoogleAuthProvider,
  type Auth,
} from 'firebase/auth';

import type { AuthResult } from '../../contexts/auth/provider';
import type { RegistrationData } from '../../contexts/auth/types';
import { isFirebaseConfigured } from './config';
import { setSessionUser } from './authSessionUser';
import { syncDisplayNameToAuthProfile } from './authProfileSync';

/** Friendly messages for the account-linking failure modes users actually hit. */
function mapLinkError(error: unknown): string {
  const code = (error as { code?: string })?.code ?? '';
  if (code === 'auth/email-already-in-use' || code === 'auth/credential-already-in-use') {
    return 'That email already has an account. Sign in with it instead — your guest activity won’t carry over.';
  }
  if (code === 'auth/provider-already-linked') {
    return 'This session is already linked to an account.';
  }
  return error instanceof Error ? error.message : 'Account upgrade failed';
}

export async function linkSessionWithEmail(auth: Auth | null, data: RegistrationData): Promise<AuthResult> {
  if (!isFirebaseConfigured() || !auth) {
    return { success: false, error: 'Firebase not configured' };
  }
  const user = auth.currentUser;
  if (!user) {
    return { success: false, error: 'No active session to upgrade' };
  }

  try {
    const credential = EmailAuthProvider.credential(data.email, data.password);
    const userCredential = await linkWithCredential(user, credential);
    setSessionUser(userCredential.user);
    await syncDisplayNameToAuthProfile(userCredential.user, data.displayName);
    return { success: true, uid: userCredential.user.uid };
  } catch (error: unknown) {
    return { success: false, error: mapLinkError(error) };
  }
}

export async function linkSessionWithGoogle(auth: Auth | null): Promise<AuthResult> {
  if (!isFirebaseConfigured() || !auth) {
    return { success: false, error: 'Firebase not configured' };
  }
  const user = auth.currentUser;
  if (!user) {
    return { success: false, error: 'No active session to upgrade' };
  }

  try {
    const userCredential = await linkWithPopup(user, new GoogleAuthProvider());
    setSessionUser(userCredential.user);
    return { success: true, uid: userCredential.user.uid };
  } catch (error: unknown) {
    return { success: false, error: mapLinkError(error) };
  }
}
