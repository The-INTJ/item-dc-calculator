'use client';

import { content } from '../../content';
import { classes } from '../shared/format';
import styles from './ProjectSwitcher.module.scss';

export type SaveIndicator = 'saving' | 'saved' | 'error' | null;

/**
 * Saving is automatic, so the only signal it needs is a dot that changes
 * colour. The same words serve as tooltip and label — there is nothing more
 * to say than which of the three states it is in.
 */
export function SaveIndicatorDot({ saveIndicator }: { saveIndicator: SaveIndicator }) {
  const label =
    saveIndicator === 'error'
      ? content.projects.error
      : saveIndicator === 'saving'
        ? content.projects.saving
        : content.projects.saved;

  return (
    <span
      className={classes(
        styles.saveDot,
        saveIndicator === 'saved' && styles.saveDotSaved,
        saveIndicator === 'error' && styles.saveDotError,
      )}
      title={label}
      aria-label={label}
    />
  );
}
