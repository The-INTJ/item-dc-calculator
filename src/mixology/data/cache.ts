import type { Contest } from '../types';

export interface CachedContestSnapshot {
  contest: Contest | null;
  updatedAt: number | null;
}

let cachedContest: Contest | null = null;
let cachedAt: number | null = null;

export function getCachedContestSnapshot(): CachedContestSnapshot {
  return {
    contest: cachedContest,
    updatedAt: cachedAt,
  };
}

export function setCachedContest(contest: Contest | null, updatedAt = Date.now()): void {
  if (!contest) {
    cachedContest = null;
    cachedAt = null;
    return;
  }

  cachedContest = contest;
  cachedAt = updatedAt;
}