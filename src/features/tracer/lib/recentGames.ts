/**
 * Games this browser has played or watched, newest first, kept in
 * localStorage so the lobby can offer "pick up where you left off" without
 * the server ever listing anyone's games. Storage can be unavailable
 * (private windows, blocked site data); every access tolerates that.
 */

import { useSyncExternalStore } from 'react';

export interface RecentGame {
  id: string;
  title: string;
  at: number;
  /** Where the game lives; online games default to `/tracer/<id>`. */
  href?: string;
}

export function recentGameHref(game: RecentGame): string {
  return game.href ?? `/tracer/${game.id}`;
}

const STORAGE_KEY = 'tracer:recentGames';
const CHANGE_EVENT = 'tracer:recent-games';
const MAX_ENTRIES = 12;
const EMPTY: readonly RecentGame[] = [];

let cachedRaw: string | null = null;
let cachedList: readonly RecentGame[] = EMPTY;

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function parse(raw: string | null): RecentGame[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.filter(
      (item): item is RecentGame =>
        typeof item?.id === 'string' &&
        typeof item?.title === 'string' &&
        typeof item?.at === 'number' &&
        (item.href === undefined || (typeof item.href === 'string' && item.href.startsWith('/tracer/'))),
    );
  } catch {
    return [];
  }
}

function snapshot(): readonly RecentGame[] {
  if (typeof window === 'undefined') return EMPTY;
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedList = parse(raw);
  }
  return cachedList;
}

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

export function rememberGame(game: { id: string; title: string; href?: string }): void {
  try {
    const rest = parse(readRaw()).filter((entry) => entry.id !== game.id);
    const next = [{ ...game, at: Date.now() }, ...rest].slice(0, MAX_ENTRIES);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // Storage is a convenience; a game works the same without it.
  }
}

export function useRecentGames(): readonly RecentGame[] {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY);
}
