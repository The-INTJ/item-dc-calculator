import 'server-only';

import { cache } from 'react';

import { isTracerError } from '../errors';
import { isGameId } from '../schemas';
import type { TracerGame } from '../types';
import { loadGame } from './gameRepository';

export type PageGame =
  | { status: 'found'; game: TracerGame }
  | { status: 'missing' }
  /** Saved under an earlier version of the rules; it cannot be continued. */
  | { status: 'outdated' };

/**
 * The game for a page render. Cached per request so the page and its
 * `generateMetadata` share one read. A malformed id is simply "missing".
 */
export const loadGameForPage = cache(async (gameId: string): Promise<PageGame> => {
  if (!isGameId(gameId)) return { status: 'missing' };
  try {
    const game = await loadGame(gameId);
    return game ? { status: 'found', game } : { status: 'missing' };
  } catch (error) {
    if (isTracerError(error) && error.code === 'GAME_OUTDATED') return { status: 'outdated' };
    throw error;
  }
});
