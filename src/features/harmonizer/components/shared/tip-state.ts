'use client';

import {
  useEffect,
  useRef,
  useState,
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react';
import { isTermId, type TermId } from '../../knowledge/glossary';
import { broadcast, subscribe } from '../../knowledge/markup/tip-channel';

/** Hover intent: long enough to ignore a pass-through, short enough to teach. */
const OPEN_DELAY_MS = 250;
/** Grace for the pointer to travel from the trigger onto the abutting panel. */
const CLOSE_GRACE_MS = 150;

/** The hover-intent timers behind scheduleOpen/scheduleClose. */
function useTipTimers() {
  const openTimerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  function clearOpenTimer() {
    if (openTimerRef.current !== null) {
      window.clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
  }

  function clearCloseTimer() {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }

  /* Clear pending timers on unmount. */
  useEffect(() => {
    return () => {
      clearOpenTimer();
      clearCloseTimer();
    };
  }, []);

  return { openTimerRef, closeTimerRef, clearOpenTimer, clearCloseTimer };
}

/**
 * The toggletip's open/pin/history state machine (extracted from Term.tsx):
 * hover-intent timers, pin/unpin, the in-place nested-term history stack, and
 * the one-tip-at-a-time tip-channel reset. `resetPlacement` is the caller's
 * hook back into the placement state cleared on close.
 */
export function useTipState(
  termId: TermId,
  instanceId: string,
  resetPlacement: () => void,
) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [history, setHistory] = useState<TermId[]>([termId]);
  const { openTimerRef, closeTimerRef, clearOpenTimer, clearCloseTimer } = useTipTimers();

  function openTip(pin: boolean) {
    clearOpenTimer();
    clearCloseTimer();
    if (!open) broadcast(instanceId);
    setOpen(true);
    if (pin) setPinned(true);
  }

  function closeTip() {
    clearOpenTimer();
    clearCloseTimer();
    setOpen(false);
    setPinned(false);
    resetPlacement();
    setHistory([termId]);
  }

  function scheduleOpen() {
    if (open || openTimerRef.current !== null) return;
    openTimerRef.current = window.setTimeout(() => {
      openTimerRef.current = null;
      openTip(false);
    }, OPEN_DELAY_MS);
  }

  function scheduleClose() {
    if (open && !pinned && closeTimerRef.current === null) {
      closeTimerRef.current = window.setTimeout(() => {
        closeTimerRef.current = null;
        closeTip();
      }, CLOSE_GRACE_MS);
    }
  }

  /* One tip at a time: close when any other instance broadcasts an open. */
  useEffect(() => {
    return subscribe((broadcasterId) => {
      if (broadcasterId === instanceId) return;
      setOpen(false);
      setPinned(false);
      resetPlacement();
      setHistory([termId]);
    });
  }, [instanceId, termId]);

  /* Nested term activation: replace the panel content in place, stay anchored. */
  function activateNested(id: string) {
    if (!isTermId(id)) return;
    setHistory((stack) => [...stack, id]);
    setPinned(true);
  }

  function popHistory() {
    setHistory((stack) => (stack.length > 1 ? stack.slice(0, -1) : stack));
  }

  return {
    open, pinned, history,
    openTip, closeTip, scheduleOpen, scheduleClose,
    clearOpenTimer, clearCloseTimer,
    activateNested, popHistory,
  };
}

export type TipState = ReturnType<typeof useTipState>;

/** The trigger/wrap event handlers, closed over the tip state machine. */
export function useTipInteractions(
  tip: TipState,
  wrapRef: RefObject<HTMLSpanElement | null>,
) {
  /* Hover is a mouse-only path — on touch, the tap's click opens pinned. */
  function handlePointerEnter(event: ReactPointerEvent<HTMLSpanElement>) {
    if (event.pointerType && event.pointerType !== 'mouse') return;
    tip.clearCloseTimer();
    tip.scheduleOpen();
  }

  function handlePointerLeave(event: ReactPointerEvent<HTMLSpanElement>) {
    if (event.pointerType && event.pointerType !== 'mouse') return;
    tip.clearOpenTimer();
    tip.scheduleClose();
  }

  /* Focus previews like hover; leaving the wrap closes an unpinned tip. */
  function handleWrapBlur(event: ReactFocusEvent<HTMLSpanElement>) {
    const next = event.relatedTarget;
    if (next instanceof Node && wrapRef.current?.contains(next)) return;
    tip.clearOpenTimer();
    if (tip.open && !tip.pinned) tip.closeTip();
  }

  /* Terms sit inside clickable cards — a term press must never select the card. */
  function handleTriggerClick(event: ReactMouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    if (tip.open && tip.pinned) {
      tip.closeTip();
    } else {
      tip.openTip(true);
    }
  }

  function handleTriggerKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'Enter' || event.key === ' ') event.stopPropagation();
  }

  return {
    handlePointerEnter, handlePointerLeave, handleWrapBlur,
    handleTriggerClick, handleTriggerKeyDown,
  };
}

export function useTipDismissal(
  open: boolean,
  wrapRef: RefObject<HTMLSpanElement | null>,
  triggerRef: RefObject<HTMLButtonElement | null>,
  closeTip: () => void,
) {
  /* Escape closes (focus back on the trigger); outside pointerdown closes. */
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (
        wrapRef.current &&
        event.target instanceof Node &&
        !wrapRef.current.contains(event.target)
      ) {
        closeTip();
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      closeTip();
      triggerRef.current?.focus();
    }
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  });
}
