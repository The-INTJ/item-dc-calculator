'use client';

import { content } from '../../content';
import type { VoiceEvent } from '../../domain/music-types';
import { classes } from '../shared/format';
import { Icon } from '../shared/Icon';
import { GhostNote } from './GhostNote';
import styles from './CandidateInspector.module.scss';

interface NoteToolbarProps {
  event: VoiceEvent;
  locked: boolean;
  /** The lane is down to one note — removal is blocked to keep the part alive. */
  soleNote: boolean;
  onToggleLock: (event: VoiceEvent) => void;
  onStepNote: (eventId: string, direction: 1 | -1) => void;
  onDeleteNote: (eventId: string) => void;
}

interface NoteToolsProps extends NoteToolbarProps {
  first: boolean;
  last: boolean;
  /** An insert would push the part past the one-measure cap. */
  ghostBlocked: boolean;
  onInsertNote: (neighborEventId: string, side: 'before' | 'after') => void;
}

/** The floating toolbar on an edited note: raise / lower / lock / remove. */
function NoteToolbar({
  event,
  locked,
  soleNote,
  onToggleLock,
  onStepNote,
  onDeleteNote,
}: NoteToolbarProps) {
  const tools = content.inspector.noteTools;
  return (
    <span
      className={styles.noteToolbar}
      role="toolbar"
      aria-label={content.inspector.noteToolsLabel}
      onClick={(clickEvent) => clickEvent.stopPropagation()}
    >
      <button
        type="button"
        className={styles.noteTool}
        disabled={locked}
        title={locked ? content.inspector.noteTools.lockedHint : undefined}
        aria-label={tools.raise}
        onClick={() => onStepNote(event.id, 1)}
      >
        <Icon name="keyboard_arrow_up" />
      </button>
      <button
        type="button"
        className={styles.noteTool}
        disabled={locked}
        title={locked ? content.inspector.noteTools.lockedHint : undefined}
        aria-label={tools.lower}
        onClick={() => onStepNote(event.id, -1)}
      >
        <Icon name="keyboard_arrow_down" />
      </button>
      {/* Every voice locks the same way — nothing defaults
          locked. (Soprano stays the generator's melodic
          anchor; that is engine behavior, not a UI freeze.) */}
      <button
        type="button"
        className={classes(styles.noteTool, locked && styles.noteToolOn)}
        aria-pressed={locked}
        aria-label={locked ? tools.unlock : tools.lock}
        onClick={() => onToggleLock(event)}
      >
        <Icon name={locked ? 'lock' : 'lock_open'} outlined />
      </button>
      <button
        type="button"
        className={styles.noteTool}
        disabled={locked || soleNote}
        title={
          soleNote
            ? content.inspector.noteTools.keepOneHint
            : locked
              ? content.inspector.noteTools.lockedHint
              : undefined
        }
        aria-label={tools.remove}
        onClick={() => onDeleteNote(event.id)}
      >
        <Icon name="close" />
      </button>
    </span>
  );
}

/**
 * The note tool cluster shown while a note is being edited: the toolbar
 * (raise / lower / lock / remove) plus the before/after ghost-note insert
 * affordances flanking the note.
 */
export function NoteTools({ first, last, ghostBlocked, onInsertNote, ...toolbar }: NoteToolsProps) {
  const tools = content.inspector.noteTools;
  const { event } = toolbar;
  return (
    <>
      <NoteToolbar {...toolbar} />
      <GhostNote
        syllable={event.scaleDegree.syllable}
        side="before"
        inside={first}
        label={tools.addBefore}
        disabled={ghostBlocked}
        onClick={() => onInsertNote(event.id, 'before')}
      />
      <GhostNote
        syllable={event.scaleDegree.syllable}
        side="after"
        inside={last}
        label={tools.addAfter}
        disabled={ghostBlocked}
        onClick={() => onInsertNote(event.id, 'after')}
      />
    </>
  );
}
