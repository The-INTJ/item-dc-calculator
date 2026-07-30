'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { content } from '../../content';
import { listTermsByTier } from '../../knowledge/glossary';
import { MarkedText } from '../shared/MarkedText';
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

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (
        rootRef.current &&
        event.target instanceof Node &&
        !rootRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

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
          <div className={styles.panelBody}>
            {listTermsByTier().map(({ tier, terms }) => (
              <section key={tier} className={styles.tierSection}>
                <h3 className={styles.tierHeading}>{content.glossary.tierHeadings[tier]}</h3>
                <dl className={styles.termList}>
                  {terms.map((entry) => (
                    <div key={entry.id} id={entryDomId(entry.id)} className={styles.termEntry}>
                      <dt className={styles.termName}>{entry.display}</dt>
                      <dd className={styles.termDefinition}>
                        <MarkedText text={entry.definition} onTermActivate={scrollToTerm} />
                        {entry.note ? (
                          <span className={styles.termNote}>{entry.note}</span>
                        ) : null}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
