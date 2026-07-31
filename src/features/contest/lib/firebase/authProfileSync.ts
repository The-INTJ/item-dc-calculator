import { updateProfile as updateFirebaseProfile, type User } from 'firebase/auth';

/**
 * Persist the display name onto the Firebase Auth record too, so
 * token-derived names match the profile document. Best-effort: failures are
 * swallowed so they never fail the surrounding auth flow.
 */
export async function syncDisplayNameToAuthProfile(user: User, displayName: string): Promise<void> {
  if (displayName.trim()) {
    await updateFirebaseProfile(user, {
      displayName: displayName.trim(),
    }).catch(() => {});
  }
}
