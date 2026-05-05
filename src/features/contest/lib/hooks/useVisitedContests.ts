import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'visitedContests';
const CHANGE_EVENT = 'visited-contests:change';
const MAX_ENTRIES = 50;

const EMPTY_SET: ReadonlySet<string> = new Set<string>();

let cachedRaw: string | null = null;
let cachedSnapshot: ReadonlySet<string> = EMPTY_SET;

function parseList(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}

function readFromStorage(): ReadonlySet<string> {
  if (typeof window === 'undefined') return EMPTY_SET;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cachedSnapshot;

  cachedRaw = raw;
  const list = parseList(raw);
  cachedSnapshot = list.length === 0 ? EMPTY_SET : new Set(list);
  return cachedSnapshot;
}

function subscribe(onChange: () => void) {
  if (typeof window === 'undefined') return () => {};
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) onChange();
  };
  const handleCustom = () => onChange();
  window.addEventListener('storage', handleStorage);
  window.addEventListener(CHANGE_EVENT, handleCustom);
  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(CHANGE_EVENT, handleCustom);
  };
}

export function markContestVisited(contestId: string): void {
  if (typeof window === 'undefined') return;
  if (!contestId) return;

  const existing = parseList(window.localStorage.getItem(STORAGE_KEY));
  const withoutId = existing.filter((id) => id !== contestId);
  const next = [...withoutId, contestId].slice(-MAX_ENTRIES);

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useVisitedContests(): ReadonlySet<string> {
  return useSyncExternalStore(subscribe, readFromStorage, () => EMPTY_SET);
}
