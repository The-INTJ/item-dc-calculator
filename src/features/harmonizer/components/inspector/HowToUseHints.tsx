'use client';

import { useId, useState } from 'react';
import { content } from '../../content';
import { classes } from '../shared/format';
import { Icon } from '../shared/Icon';
import styles from './CandidateInspector.module.scss';

/**
 * The three gestures you can't guess from looking, folded behind a
 * disclosure ABOVE the section title — open, they render large enough
 * to read while trying them. Stays mounted while no reading is selected so
 * the fold's open state survives selection changes.
 */
export function HowToUseHints({ show }: { show: boolean }) {
  /** The How-to-use gesture hints fold, closed by default (mobile concision). */
  const [hintsOpen, setHintsOpen] = useState(false);
  const hintsId = useId();
  if (!show) return null;
  return (
    <div className={styles.howToUse}>
      <button
        type="button"
        className={styles.howToUseToggle}
        aria-expanded={hintsOpen}
        aria-controls={hintsId}
        onClick={() => setHintsOpen((value) => !value)}
      >
        {content.inspector.howToUse}
        <Icon
          name="expand_more"
          className={classes(styles.chevron, hintsOpen && styles.chevronOpen)}
        />
      </button>
      {hintsOpen ? (
        <ul className={styles.hints} id={hintsId}>
          {content.inspector.hints.map((hint) => (
            <li key={hint}>{hint}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
