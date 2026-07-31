'use client';

import type { VoiceEvent } from '../../domain/music-types';
import type { TimelineSpan } from '../../domain/timing';
import { toTimelineSpan } from '../../domain/timing';
import { classes, pitchDisplay } from '../shared/format';
import { Icon } from '../shared/Icon';
import { isUnitActive, timeSpanStyle } from '../shared/timeGrid';
import { EdgeHandle } from './EdgeHandle';
import { NoteTools } from './NoteTools';
import styles from './CandidateInspector.module.scss';

/** The lane-level facts a cell's flags are derived against. */
export interface LaneCellContext {
  activeUnit: number | null;
  editingEventId: string | null;
  /** Index of the note being edited in this lane, or -1. */
  editingIndex: number;
  lockedEventIds: ReadonlySet<string>;
  /** Last occupied unit of the part (see the one-measure cap in VoiceLane). */
  partEnd: number;
  partCap: number;
  noteCount: number;
}

export interface NoteCellFlags {
  span: TimelineSpan;
  active: boolean;
  editing: boolean;
  locked: boolean;
  first: boolean;
  last: boolean;
  /** The lane is down to one note — removal is blocked. */
  soleNote: boolean;
  /** An insert copying this note's length would push past the cap. */
  ghostBlocked: boolean;
  makeRoomRight: boolean;
  makeRoomLeft: boolean;
}

/** Pure derivation of one cell's display state from the lane's facts. */
export function noteCellFlags(
  event: VoiceEvent,
  index: number,
  lane: LaneCellContext,
): NoteCellFlags {
  const span = toTimelineSpan(event.start, event.duration);
  return {
    span,
    active: isUnitActive(span, lane.activeUnit),
    editing: lane.editingEventId === event.id,
    locked: lane.lockedEventIds.has(event.id),
    first: index === 0,
    last: index === lane.noteCount - 1,
    soleNote: lane.noteCount <= 1,
    // An insert copies this note's length; blocked when that growth
    // would push the part past the one-measure cap.
    ghostBlocked: lane.partEnd + span.spanUnits > lane.partCap,
    // Notes touch, so a ghost claims room by shrinking the neighbor it
    // abuts. With no neighbor (the lane's own ends) it moves inside and
    // the edited note shortens instead.
    makeRoomRight: lane.editingIndex >= 0 && index === lane.editingIndex - 1,
    makeRoomLeft: lane.editingIndex >= 0 && index === lane.editingIndex + 1,
  };
}

interface NoteCellProps extends NoteCellFlags {
  event: VoiceEvent;
  /** Total grid units — needed by the edge handles' drag geometry. */
  gridUnits: number;
  onEditNote: (eventId: string | null) => void;
  onToggleLock: (event: VoiceEvent) => void;
  onStepNote: (eventId: string, direction: 1 | -1) => void;
  onInsertNote: (neighborEventId: string, side: 'before' | 'after') => void;
  onDeleteNote: (eventId: string) => void;
  onResize: (
    eventId: string,
    edge: 'left' | 'right',
    targetBoundary: number,
    ripple: boolean,
    gestureId: string,
  ) => void;
}

/**
 * One note glyph in a lane: syllable over pitch on the time grid, its
 * draggable edge handles, and — while it is the note being edited — the
 * NoteTools cluster.
 */
export function NoteCell({
  event,
  span,
  active,
  editing,
  locked,
  first,
  last,
  soleNote,
  ghostBlocked,
  makeRoomRight,
  makeRoomLeft,
  gridUnits,
  onEditNote,
  onToggleLock,
  onStepNote,
  onInsertNote,
  onDeleteNote,
  onResize,
}: NoteCellProps) {
  return (
    <div
      className={classes(
        styles.voiceCell,
        first && styles.cellFirst,
        last && styles.cellLast,
        active && styles.cellActive,
        editing && styles.cellEditing,
        editing && first && styles.cellGhostInsideBefore,
        editing && last && styles.cellGhostInsideAfter,
        locked && styles.cellLocked,
        makeRoomRight && styles.makeRoomRight,
        makeRoomLeft && styles.makeRoomLeft,
      )}
      style={timeSpanStyle(span)}
      data-active={active || undefined}
      data-event-id={event.id}
      data-locked={locked || undefined}
      tabIndex={0}
      onClick={() => onEditNote(editing ? null : event.id)}
      onKeyDown={(keyEvent) => {
        if (keyEvent.key === 'Enter') {
          keyEvent.preventDefault();
          keyEvent.stopPropagation();
          onEditNote(editing ? null : event.id);
        }
      }}
    >
      {locked ? <Icon name="lock" outlined className={styles.noteLockBadge} /> : null}
      <span className={styles.voiceSyllable}>
        {event.tieFromPrevious ? (
          <span aria-hidden="true" className={styles.tieMark}>
            ‿
          </span>
        ) : null}
        {event.scaleDegree.syllable}
      </span>
      <span className={styles.voicePitch}>{pitchDisplay(event.pitch)}</span>
      {first ? (
        <EdgeHandle edge="left" eventId={event.id} gridUnits={gridUnits} onResize={onResize} />
      ) : null}
      <EdgeHandle edge="right" eventId={event.id} gridUnits={gridUnits} onResize={onResize} />
      {editing ? (
        <NoteTools
          event={event}
          locked={locked}
          first={first}
          last={last}
          soleNote={soleNote}
          ghostBlocked={ghostBlocked}
          onToggleLock={onToggleLock}
          onStepNote={onStepNote}
          onInsertNote={onInsertNote}
          onDeleteNote={onDeleteNote}
        />
      ) : null}
    </div>
  );
}
