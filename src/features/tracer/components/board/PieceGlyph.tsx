import type { CSSProperties } from 'react';

import { patternKind, type Piece } from '../../engine';

import styles from './Board.module.scss';

const SHAPES = {
  king: 'M18 72 L18 36 L34 52 L50 22 L66 52 L82 36 L82 72 Z',
  warden: 'M50 14 L82 25 L82 50 Q82 74 50 88 Q18 74 18 50 L18 25 Z',
  tracer: 'M50 8 L90 50 L50 92 L10 50 Z',
} as const;

interface TracerFaceProps {
  piece: Piece;
  limit: number | null;
  line: CSSProperties;
  ink: string;
}

/**
 * A tracer's face: its step limit as a number (when the rules give it one),
 * with a small mark under it once it has a pattern — a zigzag for a rider,
 * an arc for a jumper.
 */
function TracerFace({ piece, limit, line, ink }: TracerFaceProps) {
  const kind = piece.pattern ? patternKind(piece.pattern) : null;
  return (
    <>
      {limit !== null && (
        <text x="50" y="59" textAnchor="middle" className={styles.tierNumber} style={{ fill: ink }}>
          {limit}
        </text>
      )}
      {kind === 'rider' && (
        <polyline points="38,75 44,69 50,75 56,69 62,75" style={line} strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" />
      )}
      {kind === 'jumper' && <path d="M38 77 Q50 61 62 77" style={line} strokeWidth="5" strokeLinecap="round" />}
    </>
  );
}

/**
 * Pieces are told apart by silhouette, not just colour: a crown for the
 * king, a shield for wardens, a diamond for tracers (dashed until a tracer
 * has charted). Colours are set through `style` so the CSS custom
 * properties resolve in every browser.
 */
export function PieceGlyph({ piece, limit }: { piece: Piece; limit: number | null }) {
  const fill = piece.side === 'w' ? 'var(--tr-piece-w)' : 'var(--tr-piece-b)';
  const edge = piece.side === 'w' ? 'var(--tr-piece-w-edge)' : 'var(--tr-piece-b-edge)';
  const body: CSSProperties = { fill, stroke: edge };
  const line: CSSProperties = { fill: 'none', stroke: edge };
  const unformed = piece.kind === 'tracer' && piece.pattern === null;
  return (
    <svg className={styles.glyph} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <path
        d={SHAPES[piece.kind]}
        style={body}
        strokeWidth="5"
        strokeLinejoin="round"
        strokeDasharray={unformed ? '9 6' : undefined}
      />
      {piece.kind === 'king' && <rect x="18" y="77" width="64" height="9" rx="3" style={body} strokeWidth="5" />}
      {piece.kind === 'tracer' && <TracerFace piece={piece} limit={limit} line={line} ink={edge} />}
    </svg>
  );
}
