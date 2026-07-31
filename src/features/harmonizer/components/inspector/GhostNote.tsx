'use client';

import { content } from '../../content';
import { classes } from '../shared/format';
import styles from './CandidateInspector.module.scss';

/**
 * A note that isn't there yet: same shape as a real note, translucent, dotted,
 * showing the syllable it would create (an insert copies its neighbor's pitch)
 * over the invitation to click. Replaces the old floating "+" affordances —
 * clicking a note IS how you add one now.
 */
export function GhostNote({
  syllable,
  side,
  inside,
  label,
  disabled,
  onClick,
}: {
  syllable: string;
  side: 'before' | 'after';
  /** No neighbor to scoot aside: the ghost sits inside the note, shortening it. */
  inside: boolean;
  label: string;
  /** The measure is full — the insert would be rejected, so say why. */
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={classes(
        styles.ghostNote,
        side === 'before' ? styles.ghostBefore : styles.ghostAfter,
        inside && (side === 'before' ? styles.ghostInsideBefore : styles.ghostInsideAfter),
      )}
      aria-label={label}
      disabled={disabled}
      title={disabled ? content.inspector.noteTools.measureFullHint : undefined}
      onClick={(clickEvent) => {
        clickEvent.stopPropagation();
        onClick();
      }}
    >
      <span className={styles.ghostSyllable} aria-hidden="true">
        {syllable}
      </span>
      <span className={styles.ghostHint} aria-hidden="true">
        {content.inspector.ghostAdd}
      </span>
    </button>
  );
}
