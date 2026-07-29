'use client';

import type { PointerEvent as ReactPointerEvent } from 'react';
import { content } from '../../content';
import type { VoiceEvent, VoiceId } from '../../domain/music-types';
import { toTimelineSpan } from '../../domain/timing';
import { classes, pitchDisplay } from '../shared/format';
import { newId } from '../shared/ids';
import { isUnitActive, timeSpanStyle } from '../shared/timeGrid';
import styles from './CandidateInspector.module.scss';

interface VoiceLaneProps {
  voice: VoiceId;
  events: VoiceEvent[];
  /** Soprano = the melody; its notes are always locked (pitch tools disabled). */
  melodyLocked: boolean;
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

export function VoiceLane({
  voice,
  events,
  melodyLocked,
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
    const label = grid?.querySelector('[data-lane-label]');
    if (!(grid instanceof HTMLElement) || !(label instanceof HTMLElement)) return;
    const trackLeft = label.getBoundingClientRect().right;
    const trackWidth = grid.getBoundingClientRect().right - trackLeft;
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
      <div className={styles.laneGrid} data-lane-grid>
        <span className={styles.laneLabel} data-lane-label>
          {voiceLabel}
        </span>
        {events.map((event) => {
          const span = toTimelineSpan(event.start, event.duration);
          const active = isUnitActive(span, activeUnit);
          const editing = editingEventId === event.id;
          const locked = lockedEventIds.has(event.id);
          return (
            <div
              key={event.id}
              className={classes(
                styles.voiceCell,
                active && styles.cellActive,
                editing && styles.cellEditing,
                locked && styles.cellLocked,
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
                <span className={styles.noteLockBadge} aria-hidden="true">
                  🔒
                </span>
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
              <span
                className={classes(styles.edgeHandle, styles.edgeHandleLeft)}
                aria-hidden="true"
                onClick={(clickEvent) => clickEvent.stopPropagation()}
                onPointerDown={(downEvent) => handleEdgePointerDown(downEvent, event.id, 'left')}
              />
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
                      ▲
                    </button>
                    <button
                      type="button"
                      className={styles.noteTool}
                      disabled={locked}
                      title={locked ? content.inspector.noteTools.lockedHint : undefined}
                      aria-label={tools.lower}
                      onClick={() => onStepNote(event.id, -1)}
                    >
                      ▼
                    </button>
                    {melodyLocked ? (
                      <button
                        type="button"
                        className={styles.noteTool}
                        disabled
                        title={content.melody.alwaysLocked}
                        aria-label={content.melody.alwaysLocked}
                      >
                        🔒
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={styles.noteTool}
                        aria-pressed={locked}
                        aria-label={locked ? tools.unlock : tools.lock}
                        onClick={() => onToggleLock(event)}
                      >
                        {locked ? '🔒' : '🔓'}
                      </button>
                    )}
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
                      ✕
                    </button>
                  </span>
                  <button
                    type="button"
                    className={classes(styles.addNoteEdge, styles.addNoteBefore)}
                    aria-label={tools.addBefore}
                    onClick={(clickEvent) => {
                      clickEvent.stopPropagation();
                      onInsertNote(event.id, 'before');
                    }}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className={classes(styles.addNoteEdge, styles.addNoteAfter)}
                    aria-label={tools.addAfter}
                    onClick={(clickEvent) => {
                      clickEvent.stopPropagation();
                      onInsertNote(event.id, 'after');
                    }}
                  >
                    +
                  </button>
                </>
              ) : null}
            </div>
          );
        })}
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
            ■
          </button>
        ) : (
          <button
            type="button"
            className={styles.voicePlayButton}
            aria-label={`${content.inspector.playVoice}: ${voiceLabel}`}
            onClick={onPlayVoice}
          >
            ▶
          </button>
        )}
      </div>
    </div>
  );
}
