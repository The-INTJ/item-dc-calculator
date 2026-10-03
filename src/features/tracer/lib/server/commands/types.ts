import type { StoredTurn, TracerGame } from '../../types';

/**
 * What a command decided. Commands are pure: they read a game, validate,
 * and describe the writes; the repository applies them in a transaction.
 */
export interface CommandResult<R> {
  response: R;
  /** The game to write back, or null when nothing changed. */
  game: TracerGame | null;
  /** A new turn document to create. */
  turn: StoredTurn | null;
  /** A brand-new game to create (rematches). */
  newGame: TracerGame | null;
}
