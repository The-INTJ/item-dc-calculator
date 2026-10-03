import { isKingInDanger, sideToMove } from '../../engine';
import { resultText, SIDE_NAME } from '../../lib/presentation/gameText';
import type { TracerGame } from '../../lib/types';
import styles from '../game/Status.module.scss';

interface LocalStatusProps {
  game: TracerGame;
  onUndo: () => void;
  onNewGame: () => void;
}

/** Whose move it is on this device, or how the game ended. */
export function LocalStatus({ game, onUndo, onNewGame }: LocalStatusProps) {
  if (game.status === 'finished') {
    return (
      <div className={`${styles.card} ${styles.result}`}>
        <p className={styles.eyebrow}>Game over</p>
        <p className={styles.resultText}>{resultText(game)}</p>
        <div className={styles.row}>
          <button type="button" className={styles.quiet} onClick={onUndo}>
            Undo last move
          </button>
          <button type="button" className={styles.primary} onClick={onNewGame}>
            New local game
          </button>
        </div>
      </div>
    );
  }
  const toMove = sideToMove(game.state);
  const inDanger = isKingInDanger(game.state, toMove);
  return (
    <div className={inDanger ? `${styles.notice} ${styles.danger}` : `${styles.notice} ${styles.yourMove}`}>
      <span>
        <strong>{SIDE_NAME[toMove]} to move.</strong>
        {inDanger && ' The king is under attack — dodge, block, or capture the attacker.'}
      </span>
    </div>
  );
}
