'use client';

import { useState } from 'react';
import { content } from '../../content';
import type { CandidatePath } from '../../domain/analysis-types';
import type { MelodyFragment, TonalContext, VoiceEvent, VoiceId } from '../../domain/music-types';
import { totalUnits, UNITS_PER_MEASURE, voicingUnits } from '../../domain/timing';
import type { PlaybackState, SuggestionSource } from '../../domain/workbench-state';
import { cssVars } from '../shared/timeGrid';
import { AnalysisDrawer } from './AnalysisDrawer';
import { ChordLane } from './ChordLane';
import { EffectSummary } from './EffectSummary';
import { HowToUseHints } from './HowToUseHints';
import { InspectorHeading } from './InspectorHeading';
import { LaneStack } from './LaneStack';
import { StaffView } from './staff';
import type { StaffEditing } from './staff/useStaffSelection';
import { PanSlider, useTrackPan } from './TrackPan';
import { useNoteEditing } from './useNoteEditing';
import { newId } from '../shared/ids';
import type { NotationView } from '../useViewPreference';
import styles from './CandidateInspector.module.scss';

interface CandidateInspectorProps {
  candidate: CandidatePath | null;
  fragment: MelodyFragment;
  tonalContext: TonalContext;
  view: NotationView;
  playback: PlaybackState;
  checkedVoices: VoiceId[];
  lockedEventIds: ReadonlySet<string>;
  suggestionSource: SuggestionSource | null;
  onToggleVoice: (voice: VoiceId, checked: boolean) => void;
  onPlayChecked: () => void;
  onPlayVoice: (candidateId: string, voice: VoiceId) => void;
  onStop: () => void;
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

/**
 * The editor viewport is a fixed single measure: a fresh one-beat
 * continuation renders inside the full four beats with all sixteen snap
 * positions visible. The grid widens only for legacy content that outgrew
 * a measure before the cap existed. (4/4 assumption — see the meter ledger
 * in domain/timing.ts.)
 */
/**
 * How far the tap-to-edit grid reaches in each direction. Two steps keeps the
 * grid small enough to aim at; a larger move is the same tap repeated, since
 * the grid stays open and re-centres.
 */
const GRID_REACH = 2;

/**
 * What the staff is allowed to change, expressed against one reading. Every
 * edit is routed back through the same candidate-scoped callbacks the lanes
 * use, so the two surfaces cannot drift apart.
 */
function staffEditing(candidateId: string, props: CandidateInspectorProps): StaffEditing {
  return {
    reach: GRID_REACH,
    onStepPitch: (voice, eventId, direction) =>
      props.onStepNote(candidateId, voice, eventId, direction),
    onSetLength: (voice, eventId, endUnit) =>
      props.onResizeNote(candidateId, voice, eventId, 'right', endUnit, false, newId()),
  };
}

export function inspectorGridUnits(
  fragment: MelodyFragment,
  candidate: CandidatePath | null,
): number {
  return Math.max(
    UNITS_PER_MEASURE,
    totalUnits(fragment),
    candidate ? voicingUnits(candidate.voicing) : 0,
  );
}

/**
 * The main workspace: the selected reading's four voices, harmonic
 * boundaries, and chord path, aligned on one time grid. Playback is a single
 * Play button over per-voice checkboxes (play exactly the parts you check),
 * plus a solo button on each lane.
 */
export function CandidateInspector(props: CandidateInspectorProps) {
  const { candidate, fragment, playback, checkedVoices, lockedEventIds, suggestionSource, view } =
    props;
  const [drawerOpen, setDrawerOpen] = useState(false);
  // The note-editing callbacks (onToggleNoteLock, onStepNote, onInsertNote,
  // onDeleteNote, onResizeNote) are consumed as a bundle by the hook.
  const { editingEventId, laneNoteHandlers } = useNoteEditing(candidate, props);

  /**
   * Scoped to THIS reading: whole-hymn playback runs on the rail's own
   * timeline, so it must not move this cursor or turn this transport into a
   * Stop button.
   */
  const playing =
    playback.status === 'playing' && candidate !== null && playback.candidateId === candidate.id;
  const activeUnit = playing ? playback.activeUnit : null;
  const gridUnits = inspectorGridUnits(fragment, candidate);
  const { effectivePan, setPan, panVars } = useTrackPan(gridUnits, activeUnit);

  return (
    <div>
      <HowToUseHints show={candidate !== null} />

      <InspectorHeading
        hasCandidate={candidate !== null}
        playing={playing}
        playDisabled={checkedVoices.length === 0}
        onPlay={props.onPlayChecked}
        onStop={props.onStop}
      />

      {!candidate ? (
        <p className={styles.noSelection}>{content.inspector.noSelection}</p>
      ) : (
        <div className={styles.lanes} style={cssVars(panVars)}>
          {/* Lanes are the editing surface and the staff reads back what they
              hold, so showing both is a working arrangement rather than a
              comparison — hence "both" rather than an either/or toggle. */}
          {view !== 'staff' ? (
            <LaneStack
              candidate={candidate}
              playback={playback}
              activeUnit={activeUnit}
              gridUnits={gridUnits}
              checkedVoices={checkedVoices}
              editingEventId={editingEventId}
              lockedEventIds={lockedEventIds}
              laneNoteHandlers={laneNoteHandlers}
              onToggleVoice={props.onToggleVoice}
              onPlayVoice={props.onPlayVoice}
              onStop={props.onStop}
            />
          ) : null}

          {view !== 'lanes' ? (
            <StaffView
              candidate={candidate}
              tonalContext={props.tonalContext}
              gridUnits={gridUnits}
              editing={staffEditing(candidate.id, props)}
            />
          ) : null}

          <ChordLane
            harmonyEvents={candidate.harmonyEvents}
            approachHarmony={candidate.approach?.harmony}
            activeUnit={activeUnit}
            gridUnits={gridUnits}
            computed={suggestionSource === 'computed'}
          />

          <PanSlider
            gridUnits={gridUnits}
            effectivePan={effectivePan}
            playing={playing}
            onPan={setPan}
          />

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
