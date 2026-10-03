import 'server-only';

import { cache } from 'react';

import { isGameId } from '../schemas';
import type { TracerGame } from '../types';
import { loadGame } from './gameRepository';

/**
 * The game for a page render. Cached per request so the page and its
 * `generateMetadata` share one read. A malformed id is simply "not found".
 */
export const loadGameForPage = cache(async (gameId: string): Promise<TracerGame | null> => {
  if (!isGameId(gameId)) return null;
  return loadGame(gameId);
});
