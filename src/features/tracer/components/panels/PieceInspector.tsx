import { patternKind, type Piece } from '../../engine';
import { KIND_NAME, patternLabel, SIDE_NAME } from '../../lib/presentation/gameText';
import type { TracerGame } from '../../lib/types';
import type { ComposerView } from '../../hooks/composer/composerView';
import { PatternDiagram } from './PatternDiagram';
import styles from './Panels.module.scss';

const KIND_HELP: Record<Piece['kind'], string> = {
  warden: 'Moves one square in any direction and always captures.',
  tracer: 'Strikes with its pattern, or charts a new one (charting never captures).',
  king: 'Steps one square, or moves by any pattern in its library. Lose it and you lose.',
};

function TracerDetail({ piece }: { piece: Piece }) {
  if (!piece.pattern) {
    return <p className={styles.muted}>Unformed — its first move must be a chart.</p>;
  }
  const kind = patternKind(piece.pattern);
  return (
    <div className={styles.patternRow}>
      <PatternDiagram code={piece.pattern} label={patternLabel(piece.pattern)} />
      <div>
        <p className={styles.strong}>{patternLabel(piece.pattern)}</p>
        <p className={styles.muted}>
          {kind === 'jumper'
            ? 'Lands exactly on this offset, in any of 8 orientations, ignoring pieces in between.'
            : 'Walks this path in any of 8 orientations, stopping anywhere along it; pieces block it.'}
        </p>
      </div>
    </div>
  );
}

/** Details for the tapped piece — yours or theirs. */
export function PieceInspector({ view, game }: { view: ComposerView; game: TracerGame }) {
  const piece = view.selectedPiece;
  if (!piece) {
    return <p className={styles.muted}>Tap any piece to see how it moves and what it can reach.</p>;
  }
  const library = game.state.library[piece.side];
  return (
    <div className={styles.inspector}>
      <p className={styles.strong}>
        {SIDE_NAME[piece.side]} {KIND_NAME[piece.kind]} on {piece.at}
      </p>
      <p className={styles.muted}>{KIND_HELP[piece.kind]}</p>
      {piece.kind === 'tracer' && <TracerDetail piece={piece} />}
      {piece.kind === 'king' && (
        <p className={styles.muted}>
          Library: {library.length} pattern{library.length === 1 ? '' : 's'}. Reach shown on the board: {view.targets.length}{' '}
          squares.
        </p>
      )}
    </div>
  );
}
