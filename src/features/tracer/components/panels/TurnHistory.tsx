'use client';

import { formatTurn } from '../../engine';
import { describeAction, seatName } from '../../lib/presentation/gameText';
import type { TracerGame } from '../../lib/types';
import { useTurnHistory } from '../../hooks/useTurnHistory';
import styles from './Panels.module.scss';

/** Every turn so far, newest last, in compact notation with a plain-words title. */
export function TurnHistory({ game }: { game: TracerGame }) {
  const { turns, failed } = useTurnHistory(game.id, true);
  if (failed) return <p className={styles.muted}>The move list could not be loaded.</p>;
  if (!turns) return <p className={styles.muted}>Loading moves…</p>;
  if (turns.length === 0) return <p className={styles.muted}>No moves yet.</p>;
  return (
    <ol className={styles.history}>
      {turns.map((turn) => (
        <li key={turn.ply} title={turn.actions.map(describeAction).join(', then ')}>
          <span className={styles.historySide} data-side={turn.side} aria-label={seatName(game, turn.side)} role="img" />
          <code>{formatTurn(turn)}</code>
        </li>
      ))}
    </ol>
  );
}
