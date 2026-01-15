/**
 * Cookie helpers for Mixology guest identity and invite metadata.
 */

import type { GuestIdentity, InviteContext } from './types';

const GUEST_ID_COOKIE = 'mixology_guest_id';
const GUEST_INDEX_COOKIE = 'mixology_guest_index';
const INVITE_CONTEXT_COOKIE = 'mixology_invite_context';

const DEFAULT_COOKIE_DAYS = 365;

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';').map((cookie) => cookie.trim());
  const match = cookies.find((cookie) => cookie.startsWith(`${name}=`));
  if (!match) return null;
  return decodeURIComponent(match.substring(name.length + 1));
}

function writeCookie(name: string, value: string, days = DEFAULT_COOKIE_DAYS): void {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; Expires=${expires}; Path=/`;
}

function removeCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; Max-Age=0; Path=/`;
}

function generateGuestId(): string {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return `guest_${hex}`;
  }

  return `guest_${Math.random().toString(36).substring(2)}_${Date.now()}`;
}

export function getGuestId(): string | null {
  return readCookie(GUEST_ID_COOKIE);
}

export function setGuestId(guestId: string): void {
  writeCookie(GUEST_ID_COOKIE, guestId);
}

export function getGuestIndex(): string[] {
  const raw = readCookie(GUEST_INDEX_COOKIE);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return raw.split(',').map((id) => id.trim()).filter(Boolean);
  }
}

export function setGuestIndex(guestIds: string[]): void {
  writeCookie(GUEST_INDEX_COOKIE, JSON.stringify(guestIds));
}

export function addGuestToIndex(guestId: string): string[] {
  const index = getGuestIndex();
  if (!index.includes(guestId)) {
    const updated = [...index, guestId];
    setGuestIndex(updated);
    return updated;
  }

  setGuestIndex(index);
  return index;
}

export function ensureGuestIdentity(preferExisting = true): GuestIdentity {
  const existingGuestId = preferExisting ? getGuestId() : null;
  const guestId = existingGuestId ?? generateGuestId();
  setGuestId(guestId);
  const guestIndex = addGuestToIndex(guestId);
  return { guestId, guestIndex };
}

export function clearGuestIdentity(): void {
  removeCookie(GUEST_ID_COOKIE);
  removeCookie(GUEST_INDEX_COOKIE);
}

export function getInviteContextCookie(): InviteContext | null {
  const raw = readCookie(INVITE_CONTEXT_COOKIE);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.inviteId) return null;
    return parsed as InviteContext;
  } catch {
    return null;
  }
}

export function setInviteContextCookie(inviteContext: InviteContext | null): void {
  if (!inviteContext) {
    removeCookie(INVITE_CONTEXT_COOKIE);
    return;
  }

  writeCookie(INVITE_CONTEXT_COOKIE, JSON.stringify(inviteContext));
}
