'use client';

import { useEffect, useState } from 'react';
import { content } from '../../content';
import type { CandidatePath } from '../../domain/analysis-types';
import type { MelodyFragment, VoiceEvent, VoiceId } from '../../domain/music-types';
import { totalUnits, voicingUnits } from '../../domain/timing';
import type { PlaybackState, SuggestionSource } from '../../domain/workbench-state';
import { BoundaryThroughLines } from '../workspace/BoundaryThroughLines';
import { ChordStrip } from '../workspace/ChordStrip';
import { newUserEventId } from '../shared/ids';
import { cssVars } from '../shared/timeGrid';
import { AddNoteMenu } from './AddNoteMenu';
import { AnalysisDrawer } from './AnalysisDrawer';
import { EffectSummary } from './EffectSummary';
import { VoiceLane } from './VoiceLane';
import { classes } from '../shared/format';
import styles from './CandidateInspector.module.scss';

interface CandidateInspectorProps {
  candidate: CandidatePath | null;
  candidateLetter: string | null;
  fragment: MelodyFragment;
  playback: PlaybackState;
  loopEnabled: boolean;
  checkedVoices: VoiceId[];
  lockedEventIds: ReadonlySet<string>;
  suggestionSource: SuggestionSource | null;
  suggestionNotice: 'locks_unsatisfied' | null;
  onToggleVoice: (voice: VoiceId, checked: boolean) => void;
  onPlayChecked: () => void;
  onPlayVoice: (candidateId: string, voice: VoiceId) => void;
  onStop: () => void;
  onToggleLoop: () => void;
  onToggleNoteLock: (candidateId: string, event: VoiceEvent) => void;
  onStepNote: (candidateId: string, voice: VoiceId, eventId: string, direction: 1 | -1) => void;
  onInsertNote: (
    candidateId: string,
    voice: VoiceId,
    neighborEventId: string,
    side: 'before' | 'after',
    newEventId: string,
  ) => void;
  onDeleteNote: (candidateId: string, voice: VoiceId, eventId: string) => void;
  onApply: () => void;
  onResizeNote: (
    candidateId: string,
    voice: VoiceId,
    eventId: string,
    edge: 'left' | 'right',
    targetBoundary: number,
    ripple: boolean,
    gestureId: string,
  ) => void;
}

const VOICES: VoiceId[] = ['soprano', 'alto', 'tenor', 'bass'];

/**
 * The main workspace: the selected reading's four voices, harmonic
 * boundaries, and chord path, aligned on one time grid. Playback is a single
 * Play button over per-voice checkboxes (play exactly the parts you check),
 * plus a solo button on each lane.
 */
export function CandidateInspector({
  candidate,
  candidateLetter,
  fragment,
  playback,
  loopEnabled,
  checkedVoices,
  lockedEventIds,
  suggestionSource,
  suggestionNotice,
  onToggleVoice,
  onPlayChecked,
  onPlayVoice,
  onStop,
  onToggleLoop,
  onToggleNoteLock,
  onStepNote,
  onInsertNote,
  onDeleteNote,
  onApply,
  onResizeNote,
}: CandidateInspectorProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<{ candidateId: string; eventId: string } | null>(null);

  const playing = playback.status === 'playing';
  const activeUnit = playing ? playback.activeUnit : null;
  // Editing selection is scoped to the candidate it was opened on.
  const editingEventId =
    editing && candidate && editing.candidateId === candidate.id ? editing.eventId : null;
  // The grid must cover the melody AND any voice that was dragged longer.
  const gridUnits = Math.max(
    totalUnits(fragment),
    candidate ? voicingUnits(candidate.voicing) : 0,
  );

  function editNote(eventId: string | null) {
    setEditing(eventId && candidate ? { candidateId: candidate.id, eventId } : null);
  }

  // Escape closes the note tool cluster.
  useEffect(() => {
    if (!editingEventId) return;
    function onKeyDown(keyEvent: KeyboardEvent) {
      if (keyEvent.key === 'Escape') setEditing(null);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  return (
    <div>
      <div className={styles.headingRow}>
        <h2 className={styles.heading}>
          {content.regions.inspector}
          {candidate ? (
            <span className={styles.headingTitle}>
              {candidateLetter ? `${candidateLetter} — ` : ''}
              {candidate.title}
            </span>
          ) : null}
        </h2>
        <button
          type="button"
          className={styles.apply}
          disabled={!candidate}
          onClick={onApply}
        >
          {content.inspector.apply}
        </button>
      </div>

      {!candidate ? (
        <p className={styles.noSelection}>{content.inspector.noSelection}</p>
      ) : (
        <div
          className={styles.lanes}
          style={cssVars({
            '--wb-time-units': gridUnits,
            '--wb-lane-label-width': '7rem',
          })}
        >
          <div className={styles.masterRow}>
            {playing ? (
              <button type="button" className={styles.masterButton} onClick={onStop}>
                ■ {content.inspector.stop}
              </button>
            ) : (
              <button
                type="button"
                className={styles.masterButton}
                onClick={onPlayChecked}
                disabled={checkedVoices.length === 0}
              >
                ▶ {content.inspector.play}
              </button>
            )}
            <button
              type="button"
              className={classes(styles.loopButton, loopEnabled && styles.loopActive)}
              aria-pressed={loopEnabled}
              onClick={onToggleLoop}
            >
              {content.inspector.loop}
            </button>
            <div className={styles.addNoteSlot}>
              <AddNoteMenu
                onAddNote={(voice) => {
                  const events = candidate.voicing[voice];
                  const last = events[events.length - 1];
                  if (!last) return;
                  const newEventId = newUserEventId();
                  onInsertNote(candidate.id, voice, last.id, 'after', newEventId);
                  setEditing({ candidateId: candidate.id, eventId: newEventId });
                }}
              />
            </div>
          </div>

          {suggestionNotice === 'locks_unsatisfied' ? (
            <p className={styles.notice} role="status">
              {content.notices.locksUnsatisfied}
            </p>
          ) : null}

          <div className={styles.laneStack}>
            {VOICES.map((voice) => (
              <VoiceLane
                key={voice}
                voice={voice}
                events={candidate.voicing[voice]}
                melodyLocked={voice === 'soprano'}
                activeUnit={activeUnit}
                gridUnits={gridUnits}
                checked={checkedVoices.includes(voice)}
                onCheckedChange={(checked) => onToggleVoice(voice, checked)}
                soloing={
                  playing &&
                  playback.candidateId === candidate.id &&
                  playback.voices.length === 1 &&
                  playback.voices[0] === voice
                }
                onPlayVoice={() => onPlayVoice(candidate.id, voice)}
                onStop={onStop}
                editingEventId={editingEventId}
                onEditNote={editNote}
                lockedEventIds={lockedEventIds}
                onToggleLock={(event) => onToggleNoteLock(candidate.id, event)}
                onStepNote={(eventId, direction) =>
                  onStepNote(candidate.id, voice, eventId, direction)
                }
                onInsertNote={(neighborEventId, side) => {
                  const newEventId = newUserEventId();
                  onInsertNote(candidate.id, voice, neighborEventId, side, newEventId);
                  setEditing({ candidateId: candidate.id, eventId: newEventId });
                }}
                onDeleteNote={(eventId) => {
                  onDeleteNote(candidate.id, voice, eventId);
                  if (editingEventId === eventId) setEditing(null);
                }}
                onResize={(eventId, edge, targetBoundary, ripple, gestureId) =>
                  onResizeNote(candidate.id, voice, eventId, edge, targetBoundary, ripple, gestureId)
                }
              />
            ))}
            <BoundaryThroughLines
              harmonyEvents={candidate.harmonyEvents}
              gridUnits={gridUnits}
            />
          </div>

          <div className={styles.lane}>
            <div className={styles.laneGrid}>
              <span className={styles.laneLabel}>{content.inspector.chords}</span>
              <ChordStrip
                harmonyEvents={candidate.harmonyEvents}
                activeUnit={activeUnit}
                gridUnits={gridUnits}
                computed={suggestionSource === 'computed'}
              />
            </div>
            <div className={styles.laneControls} aria-hidden="true" />
          </div>

          <EffectSummary descriptors={candidate.descriptors} />

          <AnalysisDrawer
            candidate={candidate}
            fragment={fragment}
            open={drawerOpen}
            onToggle={() => setDrawerOpen((open) => !open)}
          />
        </div>
      )}
    </div>
  );
}
