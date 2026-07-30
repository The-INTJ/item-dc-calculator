'use client';

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { content } from '../../content';
import { glossaryTerms, isTermId, type GlossaryTerm, type TermId } from '../../knowledge/glossary';
import { broadcast, subscribe } from '../../knowledge/markup/tip-channel';
import { classes } from './format';
import { MarkedText } from './MarkedText';
import styles from './Term.module.scss';

/** Hover intent: long enough to ignore a pass-through, short enough to teach. */
const OPEN_DELAY_MS = 250;
/** Grace for the pointer to travel from the trigger onto the abutting panel. */
const CLOSE_GRACE_MS = 150;

interface TermProps {
  termId: TermId;
  /**
   * prose: always-visible dotted underline (running text).
   * chip: quiet until hover/focus — the call site's class supplies the box.
   */
  variant?: 'prose' | 'chip';
  /** Composed onto the trigger so chips keep their existing box styling. */
  className?: string;
  /** Trigger content; defaults to the term's display form. */
  children?: ReactNode;
}

/**
 * The hover-enhanced glossary toggletip. Hover previews (unpinned), click/
 * Enter/Space pins, Escape/outside-press closes. The panel holds interactive
 * content (nested term links, see-also chips, back) so it is role="group",
 * never role="tooltip", and no title= attribute is involved. Nested terms
 * replace the panel content IN PLACE (a local history stack anchored to the
 * original trigger) — no popover stacking. One tip at a time via tip-channel.
 */
export function Term({ termId, variant = 'prose', className, children }: TermProps) {
  const instanceId = useId();
  const panelId = `${instanceId}-tip`;
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const [history, setHistory] = useState<TermId[]>([termId]);
  const wrapRef = useRef<HTMLSpanElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLSpanElement | null>(null);
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
    setAlignRight(false);
    setHistory([termId]);
  }

  function scheduleOpen() {
    if (open || openTimerRef.current !== null) return;
    openTimerRef.current = window.setTimeout(() => {
      openTimerRef.current = null;
      openTip(false);
    }, OPEN_DELAY_MS);
  }

  /* One tip at a time: close when any other instance broadcasts an open. */
  useEffect(() => {
    return subscribe((broadcasterId) => {
      if (broadcasterId === instanceId) return;
      setOpen(false);
      setPinned(false);
      setAlignRight(false);
      setHistory([termId]);
    });
  }, [instanceId, termId]);

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

  /* Clear pending timers on unmount. */
  useEffect(() => {
    return () => {
      clearOpenTimer();
      clearCloseTimer();
    };
  }, []);

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

  /* Hover is a mouse-only path — on touch, the tap's click opens pinned. */
  function handlePointerEnter(event: ReactPointerEvent<HTMLSpanElement>) {
    if (event.pointerType && event.pointerType !== 'mouse') return;
    clearCloseTimer();
    scheduleOpen();
  }

  function handlePointerLeave(event: ReactPointerEvent<HTMLSpanElement>) {
    if (event.pointerType && event.pointerType !== 'mouse') return;
    clearOpenTimer();
    if (open && !pinned && closeTimerRef.current === null) {
      closeTimerRef.current = window.setTimeout(() => {
        closeTimerRef.current = null;
        closeTip();
      }, CLOSE_GRACE_MS);
    }
  }

  /* Focus previews like hover; leaving the wrap closes an unpinned tip. */
  function handleWrapBlur(event: ReactFocusEvent<HTMLSpanElement>) {
    const next = event.relatedTarget;
    if (next instanceof Node && wrapRef.current?.contains(next)) return;
    clearOpenTimer();
    if (open && !pinned) closeTip();
  }

  /* Terms sit inside clickable cards — a term press must never select the card. */
  function handleTriggerClick(event: ReactMouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    if (open && pinned) {
      closeTip();
    } else {
      openTip(true);
    }
  }

  function handleTriggerKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'Enter' || event.key === ' ') event.stopPropagation();
  }

  /* Nested term activation: replace the panel content in place, stay anchored. */
  function activateNested(id: string) {
    if (!isTermId(id)) return;
    setHistory((stack) => [...stack, id]);
    setPinned(true);
  }

  function popHistory() {
    setHistory((stack) => (stack.length > 1 ? stack.slice(0, -1) : stack));
  }

  const activeTerm: GlossaryTerm = glossaryTerms[history[history.length - 1]];
  const rootTerm: GlossaryTerm = glossaryTerms[termId];
  const seeAlso = (activeTerm.seeAlso ?? []).filter(isTermId);

  return (
    <span
      ref={wrapRef}
      className={styles.termWrap}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onBlur={handleWrapBlur}
    >
      <button
        type="button"
        ref={triggerRef}
        className={classes(
          styles.termTrigger,
          variant === 'chip' ? styles.chip : styles.prose,
          className,
        )}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={handleTriggerClick}
        onKeyDown={handleTriggerKeyDown}
        onFocus={scheduleOpen}
      >
        {children ?? rootTerm.display}
      </button>
      {open ? (
        <span
          id={panelId}
          ref={panelRef}
          role="group"
          className={classes(styles.termPanel, alignRight && styles.termPanelRight)}
          onClick={(event) => event.stopPropagation()}
        >
          <span className={styles.panelTermName}>{activeTerm.display}</span>
          <span className={styles.panelDefinition}>
            <MarkedText text={activeTerm.definition} onTermActivate={activateNested} />
          </span>
          {activeTerm.note ? <span className={styles.panelNote}>{activeTerm.note}</span> : null}
          {seeAlso.length > 0 ? (
            <span className={styles.seeAlsoRow}>
              <span className={styles.seeAlsoLabel}>{content.glossary.seeAlsoLabel}</span>
              {seeAlso.map((id) => (
                <button
                  key={id}
                  type="button"
                  className={styles.seeAlsoChip}
                  onClick={() => activateNested(id)}
                >
                  {(glossaryTerms[id] as GlossaryTerm).display}
                </button>
              ))}
            </span>
          ) : null}
          {history.length > 1 ? (
            <button type="button" className={styles.backLink} onClick={popHistory}>
              {content.glossary.back}
            </button>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}
