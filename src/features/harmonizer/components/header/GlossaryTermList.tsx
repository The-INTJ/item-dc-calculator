'use client';

import { content } from '../../content';
import { listTermsByTier } from '../../knowledge/glossary';
import { MarkedText } from '../shared/MarkedText';
import styles from './GlossaryPanel.module.scss';

interface GlossaryTermListProps {
  /** Namespaces the entry ids, so two panels on a page cannot collide. */
  entryDomId: (termId: string) => string;
  onTermActivate: (termId: string) => void;
}

/**
 * Every term, grouped by tier, each definition rendered markup-aware.
 * Activating a term inside a definition scrolls to that term's own entry
 * rather than opening a nested popover.
 */
export function GlossaryTermList({ entryDomId, onTermActivate }: GlossaryTermListProps) {
  return (
    <div className={styles.panelBody}>
      {listTermsByTier().map(({ tier, terms }) => (
        <section key={tier} className={styles.tierSection}>
          <h3 className={styles.tierHeading}>{content.glossary.tierHeadings[tier]}</h3>
          <dl className={styles.termList}>
            {terms.map((entry) => (
              <div key={entry.id} id={entryDomId(entry.id)} className={styles.termEntry}>
                <dt className={styles.termName}>{entry.display}</dt>
                <dd className={styles.termDefinition}>
                  <MarkedText text={entry.definition} onTermActivate={onTermActivate} />
                  {entry.note ? <span className={styles.termNote}>{entry.note}</span> : null}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
