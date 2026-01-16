import type { Contest } from '../types';

interface ContestsApiResponse {
  contests?: Contest[];
  currentContest?: Contest | null;
}

export function extractCurrentContest(response: unknown): Contest | null {
  if (!response || typeof response !== 'object') {
    return null;
  }

  const payload = response as ContestsApiResponse;
  if (payload.currentContest && typeof payload.currentContest === 'object') {
    return payload.currentContest;
  }

  return null;
}