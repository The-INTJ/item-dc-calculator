/** Firebase identities allowed to read or change the private plant tracker. */
export const PLANT_TRACKER_ALLOWED_EMAILS = [
  'drew@taylorspot.com',
  'drewwithredhair@gmail.com',
] as const;

export function isPlantTrackerEmailAllowed(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }

  const normalizedEmail = email.trim().toLowerCase();
  return PLANT_TRACKER_ALLOWED_EMAILS.some((allowedEmail) => allowedEmail === normalizedEmail);
}
