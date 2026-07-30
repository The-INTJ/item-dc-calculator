'use client';

import type { PointerEvent as ReactPointerEvent } from 'react';
import { content } from '../../content';
import type { ApproachVoice } from '../../domain/approach';
import type { VoiceEvent, VoiceId } from '../../domain/music-types';
import { toTimelineSpan, UNITS_PER_MEASURE } from '../../domain/timing';
import { voiceTermIds } from '../../knowledge/glossary';
import { BeatDots } from '../workspace/BeatDots';
import { classes, pitchDisplay } from '../shared/format';
import { Icon } from '../shared/Icon';
import { newId } from '../shared/ids';
import { Term } from '../shared/Term';
import { isUnitActive, timeSpanStyle } from '../shared/timeGrid';
import styles from './CandidateInspector.module.scss';

interface VoiceLaneProps {
  voice: VoiceId;
  events: VoiceEvent[];
  /** The note this voice arrives from when the snippet sits mid-hymn. */
  approach?: ApproachVoice;
  activeUnit: number | null;
  /** Total grid units — needed to convert drag pixels to boundaries. */
  gridUnits: number;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  soloing: boolean;
  onPlayVoice: () => void;
  onStop: () => void;
  editingEventId: string | null;
  onEditNote: (eventId: string | null) => void;
  lockedEventIds: ReadonlySet<string>;
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
 * The note this part is coming from, stacked solfège over pitch with an arrow
 * into the first note — the seam made visible (see domain/approach.ts).
 */
function ApproachNote({ approach, voiceLabel }: { approach: ApproachVoice; voiceLabel: string }) {
  return (
    <span
      className={styles.approach}
      title={`${voiceLabel} ${content.inspector.approachPrefix} ${approach.scaleDegree.syllable} ${pitchDisplay(approach.pitch)}`}
    >
      <span className={styles.approachStack}>
        <span className={styles.approachSyllable}>{approach.scaleDegree.syllable}</span>
        <span className={styles.approachPitch}>{pitchDisplay(approach.pitch)}</span>
      </span>
      <Icon name="east" className={styles.approachArrow} />
    </span>
  );
}

/**
 * A note that isn't there yet: same shape as a real note, translucent, dotted,
 * showing the syllable it would create (an insert copies its neighbor's pitch)
 * over the invitation to click. Replaces the old floating "+" affordances —
 * clicking a note IS how you add one now.
 */
function GhostNote({
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

export function VoiceLane({
  voice,
  events,
  approach,
  activeUnit,
  gridUnits,
  checked,
  onCheckedChange,
  soloing,
  onPlayVoice,
  onStop,
  editingEventId,
  onEditNote,
  lockedEventIds,
  onToggleLock,
  onStepNote,
  onInsertNote,
  onDeleteNote,
  onResize,
}: VoiceLaneProps) {
  const voiceLabel = content.inspector.voiceLabels[voice];
  const tools = content.inspector.noteTools;
  const editingIndex = events.findIndex((event) => event.id === editingEventId);
  // Mirror of the reducer's one-measure cap (see measureCap in
  // workbenchReducer.ts): an insert grows the part by the clicked note's
  // length, so a ghost that would push past the cap is disabled with the
  // reason instead of silently no-oping.
  const partEnd = events.reduce((max, event) => {
    const span = toTimelineSpan(event.start, event.duration);
    return Math.max(max, span.startUnit - 1 + span.spanUnits);
  }, 0);
  const partCap = Math.max(UNITS_PER_MEASURE, partEnd);

  /**
   * Edge drag: convert pointer x to a 0-based sixteenth boundary using the
   * lane's own grid geometry, dispatch on every snapped change. Audio-free and
   * stateless — the reducer owns clamping and neighbor semantics.
   */
  function handleEdgePointerDown(
    pointerEvent: ReactPointerEvent<HTMLElement>,
    eventId: string,
    edge: 'left' | 'right',
  ) {
    pointerEvent.preventDefault();
    pointerEvent.stopPropagation();
    const handle = pointerEvent.currentTarget;
    const grid = handle.closest('[data-lane-grid]');
    if (!(grid instanceof HTMLElement)) return;
    // Measure from the grid itself so the math holds in both layouts: on
    // mobile the in-grid label is hidden (zero width) and the lane label sits
    // above the track instead. The rect already includes any pan transform.
    const gridRect = grid.getBoundingClientRect();
    const label = grid.querySelector('[data-lane-label]');
    const labelWidth = label instanceof HTMLElement ? label.getBoundingClientRect().width : 0;
    const trackLeft = gridRect.left + labelWidth;
    const trackWidth = gridRect.right - trackLeft;
    if (trackWidth <= 0 || gridUnits <= 0) return;
    const unitWidth = trackWidth / gridUnits;
    const gestureId = newId(); // one undo entry per drag
    let lastBoundary: number | null = null;
    try {
      handle.setPointerCapture(pointerEvent.pointerId);
    } catch {
      // jsdom has no pointer capture; harmless.
    }
    const onMove = (moveEvent: PointerEvent) => {
      const boundary = Math.round((moveEvent.clientX - trackLeft) / unitWidth);
      if (boundary !== lastBoundary) {
        lastBoundary = boundary;
        onResize(eventId, edge, boundary, moveEvent.shiftKey, gestureId);
      }
    };
    const onEnd = () => {
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onEnd);
      handle.removeEventListener('pointercancel', onEnd);
    };
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onEnd);
    handle.addEventListener('pointercancel', onEnd);
  }

  return (
    <div className={styles.lane}>
      {/* Mobile puts the label (and the controls) above the track; desktop uses
          the in-grid label below. Exactly one label is ever displayed, so only
          one reaches the accessibility tree. */}
      <span className={styles.laneLabelStacked}>
        {/* The part name teaches itself — a chip-variant glossary Term. The
            note cells stay Term-free: they are click-to-edit surfaces. */}
        <Term termId={voiceTermIds[voice]} variant="chip">
          {voiceLabel}
        </Term>
        {approach ? <ApproachNote approach={approach} voiceLabel={voiceLabel} /> : null}
      </span>
      <div className={styles.laneTrackClip}>
        <div className={styles.laneGrid} data-lane-grid>
          <BeatDots gridUnits={gridUnits} />
          <span className={styles.laneLabel} data-lane-label>
            <Term termId={voiceTermIds[voice]} variant="chip" className={styles.laneLabelText}>
              {voiceLabel}
            </Term>
            {approach ? <ApproachNote approach={approach} voiceLabel={voiceLabel} /> : null}
          </span>
          {events.map((event, index) => {
            const span = toTimelineSpan(event.start, event.duration);
            const active = isUnitActive(span, activeUnit);
            const editing = editingEventId === event.id;
            const locked = lockedEventIds.has(event.id);
            const first = index === 0;
            const last = index === events.length - 1;
            // An insert copies this note's length; blocked when that growth
            // would push the part past the one-measure cap.
            const ghostBlocked = partEnd + span.spanUnits > partCap;
            // Notes touch, so a ghost claims room by shrinking the neighbor it
            // abuts. With no neighbor (the lane's own ends) it moves inside and
            // the edited note shortens instead.
            const makeRoomRight = editingIndex >= 0 && index === editingIndex - 1;
            const makeRoomLeft = editingIndex >= 0 && index === editingIndex + 1;
            return (
              <div
                key={event.id}
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
                {locked ? (
                  <Icon name="lock" outlined className={styles.noteLockBadge} />
                ) : null}
                <span className={styles.voiceSyllable}>
                  {event.tieFromPrevious ? (
                    <span aria-hidden="true" className={styles.tieMark}>
                      ‿
                    </span>
                  ) : null}
                  {event.scaleDegree.syllable}
                </span>
                <span className={styles.voicePitch}>{pitchDisplay(event.pitch)}</span>
                {/* One draggable bar per boundary: a note owns the bar on its
                    right, and the lane's opening bar belongs to the first note
                    (dragging it opens a leading rest). */}
                {first ? (
                  <span
                    className={classes(styles.edgeHandle, styles.edgeHandleLeft)}
                    aria-hidden="true"
                    onClick={(clickEvent) => clickEvent.stopPropagation()}
                    onPointerDown={(downEvent) =>
                      handleEdgePointerDown(downEvent, event.id, 'left')
                    }
                  />
                ) : null}
                <span
                  className={classes(styles.edgeHandle, styles.edgeHandleRight)}
                  aria-hidden="true"
                  onClick={(clickEvent) => clickEvent.stopPropagation()}
                  onPointerDown={(downEvent) => handleEdgePointerDown(downEvent, event.id, 'right')}
                />
                {editing ? (
                  <>
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
                        disabled={locked || events.length <= 1}
                        title={
                          events.length <= 1
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
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
      <div className={styles.laneControls}>
        <input
          type="checkbox"
          className={styles.voiceCheck}
          checked={checked}
          onChange={(changeEvent) => onCheckedChange(changeEvent.target.checked)}
          aria-label={`${voiceLabel}: ${content.inspector.includeInPlay}`}
          title={`${voiceLabel} — ${content.inspector.includeInPlay}`}
        />
        {soloing ? (
          <button
            type="button"
            className={styles.voicePlayButton}
            aria-label={`${content.inspector.stop}: ${voiceLabel}`}
            onClick={onStop}
          >
            <Icon name="stop" />
          </button>
        ) : (
          <button
            type="button"
            className={styles.voicePlayButton}
            aria-label={`${content.inspector.playVoice}: ${voiceLabel}`}
            onClick={onPlayVoice}
          >
            <Icon name="play_arrow" />
          </button>
        )}
      </div>
    </div>
  );
}
