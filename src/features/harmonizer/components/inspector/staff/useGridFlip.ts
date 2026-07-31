'use client';

import { useLayoutEffect, useState, type RefObject } from 'react';
import type { GridSide } from './useGridPlacement';

export function otherSide(side: GridSide): GridSide {
  return side === 'below' ? 'above' : 'below';
}

/**
 * The side was chosen from where the staff sits, which is a good guess and only
 * a guess — a short window, a tall grid or a staff near an edge can all leave it
 * hanging off. So the panel measures itself once it is on screen and flips if it
 * is genuinely overflowing and the other side genuinely has room.
 *
 * Returns whether the panel should render on the opposite side from `side`.
 */
export function useGridFlip(
  panel: RefObject<HTMLDivElement | null>,
  side: GridSide,
  deps: { midi: number; units: number; reach: number },
): boolean {
  const [flipped, setFlipped] = useState(false);

  useLayoutEffect(() => {
    setFlipped(false);
    const element = panel.current;
    if (!element || typeof window === 'undefined') return;
    const rect = element.getBoundingClientRect();
    const overflows = rect.top < 0 || rect.bottom > window.innerHeight;
    if (!overflows) return;
    const height = rect.height;
    const staff = element.parentElement?.getBoundingClientRect();
    if (!staff) return;
    const roomAbove = staff.top;
    const roomBelow = window.innerHeight - staff.bottom;
    const better = side === 'below' ? roomAbove : roomBelow;
    if (better >= height) setFlipped(true);
  }, [side, deps.midi, deps.units, deps.reach]);

  return flipped;
}
