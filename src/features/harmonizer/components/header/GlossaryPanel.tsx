'use client';

import { useId, useRef, useState } from 'react';
import { content } from '../../content';
import { usePopoverDismiss } from '../shared/usePopoverDismiss';
import { GlossaryTermList } from './GlossaryTermList';
import styles from './GlossaryPanel.module.scss';

interface GlossaryHelpProps {
  /** The header supplies its own button styling. */
  triggerClassName?: string;
}

/**
 * The Help button's glossary browser: every term, grouped by tier, each
 * definition rendered markup-aware. Activating a term inside a definition
 * scrolls to that term's entry in the panel (no nested popovers here). House
 * popover pattern — local open state, outside-press + Escape close, no portal.
 */
export function GlossaryHelp({ triggerClassName }: GlossaryHelpProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const baseId = useId();

  usePopoverDismiss(open, rootRef, () => setOpen(false));

  function entryDomId(termId: string): string {
    return `${baseId}-${termId}`;
  }

  function scrollToTerm(termId: string) {
    const entry = document.getElementById(entryDomId(termId));
    entry?.scrollIntoView?.({ block: 'start' });
  }

  return (
    <div className={styles.wrap} ref={rootRef}>
      <button
        type="button"
        className={triggerClassName}
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
      >
        {content.header.help}
      </button>
      {open ? (
        <div
          className={styles.panel}
          role="group"
          aria-label={content.glossary.panelHeading}
        >
          <div className={styles.panelHeader}>
            <span className={styles.panelHeading}>{content.glossary.panelHeading}</span>
            <button
              type="button"
              className={styles.closeButton}
              onClick={() => setOpen(false)}
            >
              {content.glossary.close}
            </button>
          </div>
          <GlossaryTermList entryDomId={entryDomId} onTermActivate={scrollToTerm} />
        </div>
      ) : null}
    </div>
  );
}
