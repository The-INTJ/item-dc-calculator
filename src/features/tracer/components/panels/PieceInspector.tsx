import { kingPatterns, patternKind, type Piece, type RuleSet } from '../../engine';
import { patternLabel, SIDE_NAME } from '../../lib/presentation/gameText';
import { pieceName, shownLimit } from '../../lib/presentation/ruleText';
import type { TracerGame } from '../../lib/types';
import type { ComposerView } from '../../hooks/composer/composerView';
import { PatternDiagram } from './PatternDiagram';
import styles from './Panels.module.scss';

function kindHelp(piece: Piece, rules: RuleSet): string {
  const learns = rules.kingMemory !== 'none';
  switch (piece.kind) {
    case 'warden':
      return 'Moves one square in any direction and always captures.';
    case 'tracer': {
      const limit = shownLimit(rules, piece);
      const reach = limit === null ? 'any length' : `up to ${limit} squares`;
      const lends = learns ? ' Its king learns the pattern too.' : '';
      return `Strikes with its pattern, or charts a new one of ${reach} (charting never captures).${lends}`;
    }
    case 'king':
      return learns
        ? 'Steps one square, or moves by any of its patterns. Lose it and you lose.'
        : 'Steps one square in any direction. Lose it and you lose.';
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
  const rules = game.state.rules;
  const known = kingPatterns(game.state, piece.side).length;
  return (
    <div className={styles.inspector}>
      <p className={styles.strong}>
        {SIDE_NAME[piece.side]} {pieceName(piece, rules)} on {piece.at}
      </p>
      <p className={styles.muted}>{kindHelp(piece, rules)}</p>
      {piece.kind === 'tracer' && <TracerDetail piece={piece} />}
      {piece.kind === 'king' && (
        <p className={styles.muted}>
          {rules.kingMemory === 'none' ? '' : `Knows ${known} pattern${known === 1 ? '' : 's'} (see Kings). `}
          It can reach {view.targets.length} squares now.
        </p>
      )}
    </div>
  );
}
