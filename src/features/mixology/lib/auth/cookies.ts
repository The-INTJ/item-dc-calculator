/**
 * Cookie helpers for Mixology - minimal, cloud-first approach.
 * 
 * Firebase Auth handles session cookies automatically.
 * We only store invite context for onboarding flows.
 */

import type { InviteContext } from './types';

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

export function clearInviteContext(): void {
  removeCookie(INVITE_CONTEXT_COOKIE);
}
