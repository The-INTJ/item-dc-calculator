'use client';

import { useId, useRef, useState, type ReactNode } from 'react';
import { glossaryTerms, type GlossaryTerm, type TermId } from '../../knowledge/glossary';
import { classes } from './format';
import styles from './Term.module.scss';
import { TermPanel } from './TermPanel';
import { useTipPlacement } from './tip-placement';
import { useTipDismissal, useTipInteractions, useTipState } from './tip-state';

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
  const [alignRight, setAlignRight] = useState(false);
  /** Px nudge that pulls a tip back inside the viewport (tip-placement). */
  const [shift, setShift] = useState(0);
  const wrapRef = useRef<HTMLSpanElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLSpanElement | null>(null);

  function resetPlacement() {
    setAlignRight(false);
    setShift(0);
  }

  const tip = useTipState(termId, instanceId, resetPlacement);
  const { history } = tip;
  const handlers = useTipInteractions(tip, wrapRef);
  useTipDismissal(tip.open, wrapRef, triggerRef, tip.closeTip);
  useTipPlacement({
    open: tip.open,
    alignRight,
    history,
    triggerRef,
    panelRef,
    setAlignRight,
    setShift,
  });

  const activeTerm: GlossaryTerm = glossaryTerms[history[history.length - 1]];
  const rootTerm: GlossaryTerm = glossaryTerms[termId];

  return (
    <span
      ref={wrapRef}
      className={styles.termWrap}
      onPointerEnter={handlers.handlePointerEnter}
      onPointerLeave={handlers.handlePointerLeave}
      onBlur={handlers.handleWrapBlur}
    >
      <button
        type="button"
        ref={triggerRef}
        className={classes(
          styles.termTrigger,
          variant === 'chip' ? styles.chip : styles.prose,
          className,
        )}
        aria-expanded={tip.open}
        aria-controls={panelId}
        onClick={handlers.handleTriggerClick}
        onKeyDown={handlers.handleTriggerKeyDown}
        onFocus={tip.scheduleOpen}
      >
        {children ?? rootTerm.display}
      </button>
      {tip.open ? (
        <TermPanel
          panelId={panelId}
          panelRef={panelRef}
          alignRight={alignRight}
          shift={shift}
          activeTerm={activeTerm}
          historyDepth={history.length}
          onActivateNested={tip.activateNested}
          onBack={tip.popHistory}
        />
      ) : null}
    </span>
  );
}
