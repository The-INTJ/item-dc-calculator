import { useSyncExternalStore } from 'react';

export interface LastAdminContest {
  id: string;
  name: string;
}

const STORAGE_KEY = 'lastAdminContest';
const CHANGE_EVENT = 'last-admin-contest:change';

let cachedRaw: string | null = null;
let cachedSnapshot: LastAdminContest | null = null;

function readFromStorage(): LastAdminContest | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cachedSnapshot;

  cachedRaw = raw;
  if (!raw) {
    cachedSnapshot = null;
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<LastAdminContest>;
    if (!parsed || typeof parsed.id !== 'string' || typeof parsed.name !== 'string') {
      cachedSnapshot = null;
    } else {
      cachedSnapshot = { id: parsed.id, name: parsed.name };
    }
  } catch {
    cachedSnapshot = null;
  }
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

export function setLastAdminContest(contest: LastAdminContest | null): void {
  if (typeof window === 'undefined') return;
  if (contest == null) {
    window.localStorage.removeItem(STORAGE_KEY);
  } else {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(contest));
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useLastAdminContest(): LastAdminContest | null {
  return useSyncExternalStore(subscribe, readFromStorage, () => null);
}
