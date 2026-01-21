/**
 * Guest identity registration for Contest system.
 *
 * Attempts to register guest identity in Firestore. Falls back gracefully
 * to local-only mode if Firestore is unavailable or fails.
 */

import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase, isFirebaseConfigured } from './config';
import type { InviteContext } from '../auth/types';

const GUESTS_COLLECTION = 'contest_guests';

/**
 * Result of guest registration attempt
 */
export interface GuestRegistrationResult {
  success: boolean;
  syncedToFirestore: boolean;
  error?: string;
}

async function hashGuestId(guestId: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle && typeof crypto.subtle.digest === 'function') {
    const data = new TextEncoder().encode(guestId);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  return guestId;
}

/**
 * Register guest identity in Firestore with graceful fallback.
 *
 * @returns Result indicating success and whether Firestore sync occurred
 */
export async function registerGuestIdentity(
  guestId: string,
  inviteContext?: InviteContext,
  displayName?: string
): Promise<GuestRegistrationResult> {
  // If Firebase isn't configured, succeed locally
  if (!isFirebaseConfigured()) {
    console.info('[Guest] Firebase not configured; using local-only mode.');
    return { success: true, syncedToFirestore: false };
  }

  try {
    const { db } = initializeFirebase();
    if (!db) {
      console.warn('[Guest] Firestore unavailable; falling back to local-only mode.');
      return { success: true, syncedToFirestore: false };
    }

    const guestHash = await hashGuestId(guestId);
    await setDoc(
      doc(db, GUESTS_COLLECTION, guestHash),
      {
        guestIdHash: guestHash,
        inviteId: inviteContext?.inviteId ?? null,
        contestSlug: inviteContext?.contestSlug ?? null,
        source: inviteContext?.source ?? null,
        displayName: displayName ?? null,
        createdAt: serverTimestamp(),
        lastSeenAt: serverTimestamp(),
      },
      { merge: true }
    );

    console.log('[Guest] Registered in Firestore:', guestHash.substring(0, 8) + '...');
    return { success: true, syncedToFirestore: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.warn('[Guest] Firestore registration failed; falling back to local-only:', message);
    return { success: true, syncedToFirestore: false, error: message };
  }
}
