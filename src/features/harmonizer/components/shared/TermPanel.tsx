'use client';

import { type RefObject } from 'react';
import { content } from '../../content';
import { glossaryTerms, isTermId, type GlossaryTerm } from '../../knowledge/glossary';
import { classes } from './format';
import { MarkedText } from './MarkedText';
import styles from './Term.module.scss';

interface TermPanelProps {
  panelId: string;
  panelRef: RefObject<HTMLSpanElement | null>;
  alignRight: boolean;
  /** Px nudge that pulls a tip back inside the viewport (tip-placement). */
  shift: number;
  activeTerm: GlossaryTerm;
  /** Depth of the nested-term history stack; >1 shows the back link. */
  historyDepth: number;
  onActivateNested: (id: string) => void;
  onBack: () => void;
}

/**
 * The tip panel body (extracted from Term.tsx): definition prose, see-also
 * chips, and the back link for the in-place nested-term history. Rendered as
 * a sibling of the trigger inside the wrap span; interactive content, so
 * role="group", never role="tooltip".
 */
export function TermPanel({
  panelId,
  panelRef,
  alignRight,
  shift,
  activeTerm,
  historyDepth,
  onActivateNested,
  onBack,
}: TermPanelProps) {
  const seeAlso = (activeTerm.seeAlso ?? []).filter(isTermId);
  return (
    <span
      id={panelId}
      ref={panelRef}
      role="group"
      className={classes(styles.termPanel, alignRight && styles.termPanelRight)}
      style={shift === 0 ? undefined : { transform: `translateX(${shift}px)` }}
      onClick={(event) => event.stopPropagation()}
    >
      <span className={styles.panelTermName}>{activeTerm.display}</span>
      <span className={styles.panelDefinition}>
        <MarkedText text={activeTerm.definition} onTermActivate={onActivateNested} />
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
              onClick={() => onActivateNested(id)}
            >
              {(glossaryTerms[id] as GlossaryTerm).display}
            </button>
          ))}
        </span>
      ) : null}
      {historyDepth > 1 ? (
        <button type="button" className={styles.backLink} onClick={onBack}>
          {content.glossary.back}
        </button>
      ) : null}
    </span>
  );
}
