'use client';

import { useRef, useState } from 'react';

/** How close to an edge counts as already being there. */
const EDGE_TOLERANCE_PX = 24;
/** Breathing room left between the staff and the edge it is moved to. */
const EDGE_MARGIN_PX = 16;

export type GridSide = 'above' | 'below';

/**
 * Puts the grid where it will not cover the staff you are editing.
 *
 * If the staff already sits against the top or bottom of the window, the grid
 * simply takes the other side. Otherwise the page moves the staff to whichever
 * edge is nearer, remembers where it was, and slides back when the grid closes —
 * so opening the grid never costs you your place on the page.
 */
export function useGridPlacement(): {
  side: GridSide;
  open: (staff: HTMLElement | null) => void;
  restore: () => void;
} {
  const [side, setSide] = useState<GridSide>('below');
  const restoreTo = useRef<number | null>(null);

  function open(staff: HTMLElement | null) {
    if (!staff || typeof window === 'undefined') return;
    const rect = staff.getBoundingClientRect();
    const roomAbove = rect.top;
    const roomBelow = window.innerHeight - rect.bottom;

    if (roomAbove <= EDGE_TOLERANCE_PX) {
      restoreTo.current = null;
      setSide('below');
      return;
    }
    if (roomBelow <= EDGE_TOLERANCE_PX) {
      restoreTo.current = null;
      setSide('above');
      return;
    }

    // Neither edge — move the staff to the nearer one and remember the way back.
    const toTop = roomAbove <= roomBelow;
    restoreTo.current = window.scrollY;
    const target = toTop
      ? window.scrollY + rect.top - EDGE_MARGIN_PX
      : window.scrollY + rect.bottom - window.innerHeight + EDGE_MARGIN_PX;
    window.scrollTo({ top: Math.max(target, 0), behavior: 'smooth' });
    setSide(toTop ? 'below' : 'above');
  }

  function restore() {
    if (restoreTo.current === null || typeof window === 'undefined') return;
    window.scrollTo({ top: restoreTo.current, behavior: 'smooth' });
    restoreTo.current = null;
  }

  return { side, open, restore };
}
