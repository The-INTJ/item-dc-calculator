import { kingDeclares, kingPatterns, landsAnywhere, patternKind, tracedOnly, type Piece, type RuleSet } from '../../engine';
import { patternLabel, SIDE_NAME } from '../../lib/presentation/gameText';
import { pieceName, shownLimit } from '../../lib/presentation/ruleText';
import type { TracerGame } from '../../lib/types';
import type { ComposerView } from '../../hooks/composer/composerView';
import { PatternDiagram } from './PatternDiagram';
import styles from './Panels.module.scss';

function tracerHelp(piece: Piece, rules: RuleSet): string {
  const limit = shownLimit(rules, piece);
  const reach = limit === null ? 'any length' : `up to ${limit} squares`;
  const stop = landsAnywhere(rules) ? ', stopping anywhere along it or staying put' : '';
  const step = rules.tracerStep ? ' It may instead step one square (no capture).' : '';
  const lends = rules.kingMemory !== 'none' ? ' Its king can borrow the pattern too.' : '';
  return `Strikes with its pattern, or charts a new one of ${reach}${stop} (charting never captures).${step}${lends}`;
}

function kingHelp(rules: RuleSet): string {
  if (rules.kingMemory === 'none') return 'Steps one square in any direction. Lose it and you lose.';
  if (kingDeclares(rules)) {
    return 'Steps one square, or spends a turn declaring one of its Tracers’ routes — then moves by it on later turns. Lose it and you lose.';
  }
  return 'Steps one square, or moves by any of its patterns. Lose it and you lose.';
}

function kindHelp(piece: Piece, rules: RuleSet): string {
  switch (piece.kind) {
    case 'warden':
      return 'Moves one square in any direction and always captures.';
    case 'tracer':
      return tracerHelp(piece, rules);
    case 'king':
      return kingHelp(rules);
  }
}

function patternUse(code: string, rules: RuleSet): string {
  const turns = tracedOnly(rules) ? 'exactly as traced, from where it stands' : 'in any of 8 orientations';
  return patternKind(code) === 'jumper'
    ? `Lands exactly on this offset, ${turns}, ignoring pieces in between.`
    : `Walks this path ${turns}, stopping anywhere along it; pieces block it.`;
}

function PatternDetail({ piece, rules }: { piece: Piece; rules: RuleSet }) {
  if (!piece.pattern) {
    const first = rules.tracerStep ? 'It can step a square, or chart one.' : 'Its first move must be a chart.';
    return <p className={styles.muted}>{piece.kind === 'king' ? 'No route declared yet.' : `Unformed — ${first}`}</p>;
  }
  return (
    <div className={styles.patternRow}>
      <PatternDiagram code={piece.pattern} label={patternLabel(piece.pattern)} />
      <div>
        <p className={styles.strong}>
          {piece.kind === 'king' ? 'Declared: ' : ''}
          {patternLabel(piece.pattern)}
        </p>
        <p className={styles.muted}>{patternUse(piece.pattern, rules)}</p>
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
      {piece.kind === 'tracer' && <PatternDetail piece={piece} rules={rules} />}
      {piece.kind === 'king' && kingDeclares(rules) && <PatternDetail piece={piece} rules={rules} />}
      {piece.kind === 'king' && (
        <p className={styles.muted}>
          {rules.kingMemory === 'none' ? '' : `Can borrow ${known} pattern${known === 1 ? '' : 's'} (see Kings). `}
          It can reach {view.targets.length} squares now.
        </p>
      )}
    </div>
  );
}
