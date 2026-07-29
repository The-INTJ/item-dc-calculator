/**
 * Id minting for user-created things (notes, gestures, applied fragments,
 * projects). Impure by nature, so it lives with the components — the reducer
 * only ever receives ids, never mints them (purity + StrictMode safety).
 */

export function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().slice(0, 12);
  }
  return Math.random().toString(36).slice(2, 14);
}

export function newUserEventId(): string {
  return `user-${newId()}`;
}
