'use client';

import { useEffect, type RefObject } from 'react';

/**
 * Escape, or a press anywhere outside the grid, closes it.
 *
 * A note's own button is exempt and decides for itself: tapping the open note
 * closes the grid, tapping a different one moves to it. Closing here as well
 * would land the grid back open, because the staff would see no selection by
 * the time the click arrived.
 */
export function useGridDismiss(panel: RefObject<HTMLDivElement | null>, onClose: () => void) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    function onPointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (panel.current?.contains(target)) return;
      if (target.closest('[data-staff-system] button[data-event-id]')) return;
      onClose();
    }
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, [onClose]);
}
