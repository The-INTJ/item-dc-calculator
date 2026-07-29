'use client';

import { useEffect, useState } from 'react';
import { content } from '../../content';
import type { CandidatePath } from '../../domain/analysis-types';
import type {
  BoundaryConstraint,
  MelodyFragment,
  VoiceEvent,
  VoiceId,
} from '../../domain/music-types';
import { totalUnits, toTimelineSpan, voicingUnits } from '../../domain/timing';
import type { PlaybackState } from '../../domain/workbench-state';
import { HarmonyEventBlock } from '../shared/HarmonyEventBlock';
import { cssVars, isUnitActive } from '../shared/timeGrid';
import { AnalysisDrawer } from './AnalysisDrawer';
import { BoundaryRow } from './BoundaryRow';
import { EffectSummary } from './EffectSummary';
import { VoiceLane } from './VoiceLane';
import { classes } from '../shared/format';
import styles from './CandidateInspector.module.scss';

interface CandidateInspectorProps {
  candidate: CandidatePath | null;
  candidateLetter: string | null;
  fragment: MelodyFragment;
  boundaryConstraints: BoundaryConstraint[];
  playback: PlaybackState;
  loopEnabled: boolean;
  checkedVoices: VoiceId[];
  lockedEventIds: ReadonlySet<string>;
  onToggleVoice: (voice: VoiceId, checked: boolean) => void;
  onPlayChecked: () => void;
  onPlayVoice: (candidateId: string, voice: VoiceId) => void;
  onStop: () => void;
  onToggleLoop: () => void;
  onToggleNoteLock: (candidateId: string, event: VoiceEvent) => void;
  onResizeNote: (
    candidateId: string,
    voice: VoiceId,
    eventId: string,
    edge: 'left' | 'right',
    targetBoundary: number,
    ripple: boolean,
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
  boundaryConstraints,
  playback,
  loopEnabled,
  checkedVoices,
  lockedEventIds,
  onToggleVoice,
  onPlayChecked,
  onPlayVoice,
  onStop,
  onToggleLoop,
  onToggleNoteLock,
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
        <button type="button" className={styles.apply} disabled title={content.comingSoon}>
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
            <button type="button" className={styles.addNote} disabled title={content.comingSoon}>
              + {content.melody.addNote}
            </button>
          </div>

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
              onResize={(eventId, edge, targetBoundary, ripple) =>
                onResizeNote(candidate.id, voice, eventId, edge, targetBoundary, ripple)
              }
            />
          ))}

          <BoundaryRow
            fragment={fragment}
            boundaryConstraints={boundaryConstraints}
            gridUnits={gridUnits}
          />

          <div className={styles.lane}>
            <div className={styles.laneGrid}>
              <span className={styles.laneLabel}>{content.inspector.chords}</span>
              {candidate.harmonyEvents.map((event) => (
                <HarmonyEventBlock
                  key={event.id}
                  event={event}
                  active={isUnitActive(toTimelineSpan(event.start, event.duration), activeUnit)}
                />
              ))}
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
