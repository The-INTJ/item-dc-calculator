'use client';

import { content } from '../../../content';
import { Icon } from '../../shared/Icon';
import styles from './NoteGrid.module.scss';

interface NoteGridFooterProps {
  /** Whether the open note is currently silent. */
  isRest: boolean;
  /** False once the part is down to its last note, which it always keeps. */
  canDelete: boolean;
  onToggleRest: () => void;
  onDelete: () => void;
}

/**
 * What can happen to the open note besides changing it: silence it, or remove
 * it.
 *
 * The two are deliberately different and sit apart from each other. Silencing
 * is a SWITCH — the note keeps its pitch and its place, so it can be switched
 * back and heard both ways. Deleting keeps nothing. Putting them side by side
 * without saying so would invite reaching for the lossy one by accident, so
 * the toggle reads as a state and the delete reads as an action.
 */
export function NoteGridFooter({
  isRest,
  canDelete,
  onToggleRest,
  onDelete,
}: NoteGridFooterProps) {
  return (
    <div className={styles.footer}>
      <div className={styles.toggle} role="group" aria-label={content.noteGrid.soundLabel}>
        <button
          type="button"
          className={styles.toggleOption}
          aria-pressed={!isRest}
          onClick={() => (isRest ? onToggleRest() : undefined)}
        >
          {content.noteGrid.sounds}
        </button>
        <button
          type="button"
          className={styles.toggleOption}
          aria-pressed={isRest}
          onClick={() => (isRest ? undefined : onToggleRest())}
        >
          {content.noteGrid.silent}
        </button>
      </div>

      <button
        type="button"
        className={styles.delete}
        disabled={!canDelete}
        aria-label={content.noteGrid.deleteLabel}
        title={canDelete ? undefined : content.noteGrid.keepOneHint}
        onClick={onDelete}
      >
        <Icon name="delete" outlined />
        <span>{content.noteGrid.delete}</span>
      </button>
    </div>
  );
}
