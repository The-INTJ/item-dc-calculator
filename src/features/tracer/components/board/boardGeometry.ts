/**
 * Where squares sit on screen. The board is drawn from one side's point of
 * view: that side's back rank along the bottom. Grid cells and the SVG
 * overlay (an 8×8 viewBox, one unit per square) share these coordinates.
 */

import { squareCoords, squareFromCoords, type Side, type SquareName } from '../../engine';

export interface Cell {
  col: number;
  row: number;
}

export function cellOf(square: SquareName, orientation: Side): Cell {
  const coords = squareCoords(square) ?? { file: 0, rank: 0 };
  return orientation === 'w'
    ? { col: coords.file, row: 7 - coords.rank }
    : { col: 7 - coords.file, row: coords.rank };
}

export function squareAtCell(cell: Cell, orientation: Side): SquareName | null {
  return orientation === 'w'
    ? squareFromCoords(cell.col, 7 - cell.row)
    : squareFromCoords(7 - cell.col, cell.row);
}

/** All 64 squares in reading order: top-left to bottom-right. */
export function displayOrder(orientation: Side): SquareName[] {
  const squares: SquareName[] = [];
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      squares.push(squareAtCell({ col, row }, orientation) as SquareName);
    }
  }
  return squares;
}

export function centerOf(square: SquareName, orientation: Side): { x: number; y: number } {
  const { col, row } = cellOf(square, orientation);
  return { x: col + 0.5, y: row + 0.5 };
}

export function isLightSquare(square: SquareName): boolean {
  const coords = squareCoords(square);
  return coords !== null && (coords.file + coords.rank) % 2 === 1;
}

/** The neighbouring cell in an arrow-key direction, or null at the edge. */
export function stepCell(cell: Cell, key: string): Cell | null {
  const delta: Record<string, [number, number]> = {
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
  };
  const move = delta[key];
  if (!move) return null;
  const next = { col: cell.col + move[0], row: cell.row + move[1] };
  return next.col < 0 || next.col > 7 || next.row < 0 || next.row > 7 ? null : next;
}
