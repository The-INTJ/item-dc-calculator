'use client';

import { useRef, useState, type KeyboardEvent } from 'react';

import type { GameState, Side, SquareName } from '../../engine';
import { marksFor, type SquareMarks } from './boardMarks';
import { cellOf, displayOrder, squareAtCell, stepCell } from './boardGeometry';
import { BoardOverlay } from './BoardOverlay';
import { BoardSquare } from './BoardSquare';
import type { OverlayLine } from './overlayModel';
import styles from './Board.module.scss';

interface BoardProps {
  board: GameState;
  orientation: Side;
  marks: Map<SquareName, SquareMarks>;
  lines: OverlayLine[];
  label: string;
  onTap: (square: SquareName) => void;
  /** Hover, focus or tap names a square to inspect; null when the mouse leaves. */
  onProbe?: (square: SquareName | null) => void;
}

/**
 * The 8×8 board: a grid of real buttons (one tab stop, arrow keys move
 * between squares) with an SVG overlay for paths on top.
 */
export function Board({ board, orientation, marks, lines, label, onTap, onProbe = () => {} }: BoardProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [focusSquare, setFocusSquare] = useState<SquareName>(orientation === 'w' ? 'd1' : 'd8');
  const pieces = new Map(board.pieces.map((piece) => [piece.at, piece]));

  function onArrow(event: KeyboardEvent<HTMLButtonElement>, square: SquareName) {
    const next = stepCell(cellOf(square, orientation), event.key);
    if (!next) return;
    event.preventDefault();
    const target = squareAtCell(next, orientation);
    if (!target) return;
    setFocusSquare(target);
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-square="${target}"]`)?.focus();
  }

  return (
    <div className={styles.frame}>
      <div
        ref={gridRef}
        className={styles.grid}
        role="group"
        aria-label={label}
        onPointerLeave={(event) => event.pointerType === 'mouse' && onProbe(null)}
      >
        {displayOrder(orientation).map((square, index) => (
          <BoardSquare
            key={square}
            square={square}
            piece={pieces.get(square) ?? null}
            marks={marksFor(marks, square)}
            rules={board.rules}
            fileLabel={index >= 56 ? square[0] : null}
            rankLabel={index % 8 === 0 ? square[1] : null}
            focusable={square === focusSquare}
            onTap={(tapped) => {
              setFocusSquare(tapped);
              onTap(tapped);
            }}
            onArrow={onArrow}
            onProbe={onProbe}
          />
        ))}
      </div>
      <BoardOverlay lines={lines} />
    </div>
  );
}
