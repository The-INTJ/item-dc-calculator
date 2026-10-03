import type { CSSProperties } from 'react';

import { patternKind, type Piece } from '../../engine';

import styles from './Board.module.scss';

const SHAPES = {
  king: 'M18 72 L18 36 L34 52 L50 22 L66 52 L82 36 L82 72 Z',
  warden: 'M50 14 L82 25 L82 50 Q82 74 50 88 Q18 74 18 50 L18 25 Z',
  tracer: 'M50 10 L88 50 L50 90 L12 50 Z',
} as const;

/** The small mark inside a tracer: empty ring (unformed), zigzag (rider), arc (jumper). */
function TracerMark({ piece, line }: { piece: Piece; line: CSSProperties }) {
  const kind = piece.pattern ? patternKind(piece.pattern) : null;
  if (kind === 'rider') {
    return <polyline points="34,58 44,42 56,58 66,42" style={line} strokeWidth="6" strokeLinejoin="round" strokeLinecap="round" />;
  }
  if (kind === 'jumper') {
    return <path d="M32 60 Q50 24 68 60" style={line} strokeWidth="6" strokeLinecap="round" />;
  }
  return <circle cx="50" cy="50" r="9" style={line} strokeWidth="5" />;
}

/**
 * Pieces are told apart by silhouette, not just colour: a crown for the
 * king, a shield for wardens, a diamond for tracers. Colours are set through
 * `style` so the CSS custom properties resolve in every browser.
 */
export function PieceGlyph({ piece }: { piece: Piece }) {
  const fill = piece.side === 'w' ? 'var(--tr-piece-w)' : 'var(--tr-piece-b)';
  const edge = piece.side === 'w' ? 'var(--tr-piece-w-edge)' : 'var(--tr-piece-b-edge)';
  const body: CSSProperties = { fill, stroke: edge };
  const line: CSSProperties = { fill: 'none', stroke: edge };
  return (
    <svg className={styles.glyph} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <path d={SHAPES[piece.kind]} style={body} strokeWidth="5" strokeLinejoin="round" />
      {piece.kind === 'king' && <rect x="18" y="77" width="64" height="9" rx="3" style={body} strokeWidth="5" />}
      {piece.kind === 'tracer' && <TracerMark piece={piece} line={line} />}
    </svg>
  );
}
