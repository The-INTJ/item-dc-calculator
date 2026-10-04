import type { KeyboardEvent } from 'react';

import type { Piece, RuleSet, SquareName } from '../../engine';
import { shownLimit } from '../../lib/presentation/ruleText';
import type { SquareMarks } from './boardMarks';
import { isLightSquare } from './boardGeometry';
import { PieceGlyph } from './PieceGlyph';
import { squareLabel } from './squareLabel';
import styles from './Board.module.scss';

interface BoardSquareProps {
  square: SquareName;
  piece: Piece | null;
  marks: SquareMarks;
  rules: RuleSet;
  fileLabel: string | null;
  rankLabel: string | null;
  focusable: boolean;
  onTap: (square: SquareName) => void;
  onArrow: (event: KeyboardEvent<HTMLButtonElement>, square: SquareName) => void;
}

function squareClass(square: SquareName, marks: SquareMarks): string {
  return [
    styles.square,
    isLightSquare(square) ? styles.light : styles.dark,
    marks.lastMove && styles.lastMove,
    marks.selected && styles.selected,
    marks.threatened && styles.threatened,
    marks.chartIndex !== null && styles.onPath,
  ]
    .filter(Boolean)
    .join(' ');
}

export function BoardSquare(props: BoardSquareProps) {
  const { square, piece, marks, rules } = props;
  const capture = marks.target === 'capture' || marks.reach === 'capture';
  const quietTarget = marks.target === 'move' || marks.reach === 'move';
  return (
    <button
      type="button"
      className={squareClass(square, marks)}
      aria-label={squareLabel(square, piece, marks, rules)}
      data-square={square}
      tabIndex={props.focusable ? 0 : -1}
      onClick={() => props.onTap(square)}
      onKeyDown={(event) => props.onArrow(event, square)}
    >
      {props.rankLabel && <span className={styles.rankLabel}>{props.rankLabel}</span>}
      {props.fileLabel && <span className={styles.fileLabel}>{props.fileLabel}</span>}
      {piece && <PieceGlyph piece={piece} limit={shownLimit(rules, piece)} />}
      {quietTarget && !piece && <span className={marks.reach ? styles.reachDot : styles.dot} />}
      {capture && <span className={marks.reach ? styles.reachRing : styles.ring} />}
      {marks.chartNext && <span className={styles.chartNext} />}
      {marks.step && <span className={styles.stepMark} />}
      {marks.chartIndex !== null && <span className={styles.pathIndex}>{marks.chartIndex}</span>}
    </button>
  );
}
