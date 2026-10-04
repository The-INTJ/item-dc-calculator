import { dodgeLimit, sideToMove, type PieceKind, type Side } from '../../engine';
import { SIDE_NAME, seatName } from '../../lib/presentation/gameText';
import type { TracerGame } from '../../lib/types';
import styles from './Game.module.scss';

interface PlayerBarProps {
  game: TracerGame;
  side: Side;
  isViewer: boolean;
}

/** Name, whose move it is, what is left on the board, and the dodge count. */
export function PlayerBar({ game, side, isViewer }: PlayerBarProps) {
  const toMove = game.status === 'active' && sideToMove(game.state) === side;
  const pieces = game.state.pieces.filter((piece) => piece.side === side);
  const count = (kind: PieceKind) => pieces.filter((piece) => piece.kind === kind).length;
  const streak = game.state.stepStreak[side];
  const limit = dodgeLimit(game.state.rules);
  return (
    <div className={toMove ? `${styles.player} ${styles.playerToMove}` : styles.player}>
      <span className={styles.swatch} data-side={side} aria-label={SIDE_NAME[side]} role="img" />
      <span className={styles.playerName}>
        {seatName(game, side)}
        {isViewer && <span className={styles.you}> · you</span>}
      </span>
      {toMove && <span className={styles.toMove}>to move</span>}
      <span className={styles.material} aria-label={`${count('tracer')} Tracers and ${count('warden')} Wardens left`}>
        T{count('tracer')} · W{count('warden')}
      </span>
      {streak > 0 && limit !== null && (
        <span className={styles.streak} title="Free king steps in a row with no capture">
          Dodges {streak}/{limit}
        </span>
      )}
    </div>
  );
}

interface BoardToolbarProps {
  showThreats: boolean;
  onToggleThreats: () => void;
  onFlip: () => void;
}

export function BoardToolbar({ showThreats, onToggleThreats, onFlip }: BoardToolbarProps) {
  return (
    <div className={styles.toolbar}>
      <button type="button" className={styles.chip} aria-pressed={showThreats} onClick={onToggleThreats}>
        {showThreats ? 'Hide threats' : 'Show threats'}
      </button>
      <button type="button" className={styles.chip} onClick={onFlip}>
        Flip board
      </button>
    </div>
  );
}
