import type { Piece, RuleSet, SquareName } from '../../engine';
import { patternLabel, SIDE_NAME } from '../../lib/presentation/gameText';
import { pieceName } from '../../lib/presentation/ruleText';
import type { SquareMarks } from './boardMarks';

function pieceText(piece: Piece, rules: RuleSet): string {
  const base = `${SIDE_NAME[piece.side]} ${pieceName(piece, rules)}`;
  if (piece.kind !== 'tracer') return base;
  return piece.pattern ? `${base}, ${patternLabel(piece.pattern).toLowerCase()}` : `${base}, unformed`;
}

/** What a screen reader hears for one square, e.g. "e4, Black Warden, capture". */
export function squareLabel(square: SquareName, piece: Piece | null, marks: SquareMarks, rules: RuleSet): string {
  const parts = [square, piece ? pieceText(piece, rules) : 'empty'];
  if (marks.selected) parts.push('selected');
  if (marks.target === 'capture') parts.push('capture');
  else if (marks.target === 'move') parts.push('move here');
  if (marks.chartIndex !== null) parts.push(`path step ${marks.chartIndex}`);
  else if (marks.chartNext) parts.push('extend path here');
  if (marks.step) parts.push('free king step here');
  if (marks.reach) parts.push(marks.reach === 'capture' ? 'can be captured by selection' : 'in reach');
  if (marks.threatened) parts.push('covered by opponent');
  if (marks.guarded) parts.push('protected');
  if (marks.lastMove) parts.push('last move');
  return parts.join(', ');
}
