'use client';

import { useLayoutEffect, type Dispatch, type RefObject, type SetStateAction } from 'react';
import type { TermId } from '../../knowledge/glossary';

/** Breathing room between a tip panel and the edge of the screen. */
const VIEWPORT_MARGIN = 8;

interface TipPlacementArgs {
  open: boolean;
  alignRight: boolean;
  history: TermId[];
  triggerRef: RefObject<HTMLButtonElement | null>;
  panelRef: RefObject<HTMLSpanElement | null>;
  setAlignRight: Dispatch<SetStateAction<boolean>>;
  setShift: Dispatch<SetStateAction<number>>;
}

/**
 * The tip panel's placement effects (extracted from Term.tsx). The alignRight
 * and shift state stay in Term — closing resets them there — and this hook
 * measures the rendered panel and writes them back.
 */
export function useTipPlacement({
  open,
  alignRight,
  history,
  triggerRef,
  panelRef,
  setAlignRight,
  setShift,
}: TipPlacementArgs) {
  /**
   * Portal-free positioning: the panel hangs below the trigger, left-aligned;
   * if that would overflow the nearest [data-glossary-boundary] ancestor's
   * right edge, mirror to right-aligned instead (PopoverMenu's approach).
   */
  useLayoutEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const panel = panelRef.current;
    if (!trigger || !panel) return;
    const boundary = trigger.closest('[data-glossary-boundary]');
    if (!(boundary instanceof HTMLElement)) return;
    const panelWidth = panel.offsetWidth;
    if (panelWidth <= 0) return; // jsdom: no layout — keep the default side
    setAlignRight(
      trigger.getBoundingClientRect().left + panelWidth >
        boundary.getBoundingClientRect().right,
    );
  }, [open]);

  /**
   * Flipping sides is not always enough: a trigger in the middle of a phone
   * screen overflows whichever way the panel hangs. Measure the settled panel
   * and slide it back inside (Drew, 2026-07-30 — "the modal sometimes bleeds
   * off-screen"). The transform is cleared before measuring so the maths is
   * always against the untransformed position, never a previous nudge.
   */
  useLayoutEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;
    panel.style.transform = 'none';
    const rect = panel.getBoundingClientRect();
    if (rect.width === 0) return; // jsdom: no layout
    let delta = 0;
    if (rect.right > window.innerWidth - VIEWPORT_MARGIN) {
      delta = window.innerWidth - VIEWPORT_MARGIN - rect.right;
    }
    if (rect.left + delta < VIEWPORT_MARGIN) delta = VIEWPORT_MARGIN - rect.left;
    setShift(delta);
  }, [open, alignRight, history]);
}
