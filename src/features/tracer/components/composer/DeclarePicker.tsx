import type { PatternCode } from '../../engine';
import type { ComposerView } from '../../hooks/composer/composerView';
import { patternLabel } from '../../lib/presentation/gameText';
import styles from './ActionBar.module.scss';

/**
 * The king's declare options: one chip per route it may borrow, named by the
 * Tracer lending it. Declaring is the king's whole turn; the route is usable
 * from its next turn, and the board shows it to both players.
 */
export function DeclarePicker({ view, onDeclare }: { view: ComposerView; onDeclare: (pattern: PatternCode) => void }) {
  const king = view.selectedPiece;
  if (!king || view.declarable.length === 0) return null;
  const lender = (pattern: PatternCode) =>
    view.board.pieces.find((p) => p.side === king.side && p.kind === 'tracer' && p.pattern === pattern);
  return (
    <div className={styles.declare} role="group" aria-label="Declare a route">
      <span className={styles.declareTitle}>Declare a route</span>
      {view.declarable.map((pattern) => {
        const from = lender(pattern)?.at;
        const declared = king.pattern === pattern;
        return (
          <button
            key={pattern}
            type="button"
            className={styles.declareChip}
            aria-pressed={declared}
            onClick={() => onDeclare(pattern)}
          >
            {patternLabel(pattern)}
            {from ? ` · ${from} Tracer` : ' · kept'}
            {declared ? ' (declared)' : ''}
          </button>
        );
      })}
    </div>
  );
}
