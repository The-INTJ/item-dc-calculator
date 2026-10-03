import { kingPatternList, patternKind, type Piece } from '../../engine';
import { patternLabel, pieceName, SIDE_NAME } from '../../lib/presentation/gameText';
import type { TracerGame } from '../../lib/types';
import type { ComposerView } from '../../hooks/composer/composerView';
import { PatternDiagram } from './PatternDiagram';
import styles from './Panels.module.scss';

function kindHelp(piece: Piece): string {
  switch (piece.kind) {
    case 'warden':
      return 'Moves one square in any direction and always captures.';
    case 'tracer':
      return `Strikes with its pattern, or charts a new one of up to ${piece.range ?? 'any number of'} squares (charting never captures). Its king borrows the pattern too.`;
    case 'king':
      return 'Steps one square, or moves by any pattern its Tracers lend it. Lose it and you lose.';
  }
}

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
  const borrowed = kingPatternList(game.state, piece.side).length;
  return (
    <div className={styles.inspector}>
      <p className={styles.strong}>
        {SIDE_NAME[piece.side]} {pieceName(piece)} on {piece.at}
      </p>
      <p className={styles.muted}>{kindHelp(piece)}</p>
      {piece.kind === 'tracer' && <TracerDetail piece={piece} />}
      {piece.kind === 'king' && (
        <p className={styles.muted}>
          Borrowing {borrowed} pattern{borrowed === 1 ? '' : 's'} (see Kings). It can reach {view.targets.length} squares now.
        </p>
      )}
    </div>
  );
}
