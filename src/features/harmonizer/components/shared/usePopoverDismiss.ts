'use client';

import { useEffect, type RefObject } from 'react';

/**
 * The house dismissal rule for the hand-rolled popovers: a press anywhere
 * outside the popover's root, or Escape, closes it. Listeners are only bound
 * while it is open, so a closed popover costs nothing.
 */
export function usePopoverDismiss(
  open: boolean,
  rootRef: RefObject<HTMLDivElement | null>,
  onClose: () => void,
) {
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (
        rootRef.current &&
        event.target instanceof Node &&
        !rootRef.current.contains(event.target)
      ) {
        onClose();
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);
}
