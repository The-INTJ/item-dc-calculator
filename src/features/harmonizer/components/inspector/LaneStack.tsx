'use client';

import type { CandidatePath } from '../../domain/analysis-types';
import type { VoiceId } from '../../domain/music-types';
import type { PlaybackState } from '../../domain/workbench-state';
import { BoundaryThroughLines } from '../workspace/BoundaryThroughLines';
import { useNoteEditing } from './useNoteEditing';
import { VoiceLane } from './VoiceLane';
import styles from './CandidateInspector.module.scss';

const VOICES: VoiceId[] = ['soprano', 'alto', 'tenor', 'bass'];

/** The per-voice note-edit handler bundle produced by useNoteEditing. */
type LaneNoteHandlers = ReturnType<typeof useNoteEditing>['laneNoteHandlers'];

interface LaneStackProps {
  candidate: CandidatePath;
  playback: PlaybackState;
  activeUnit: number | null;
  gridUnits: number;
  checkedVoices: VoiceId[];
  editingEventId: string | null;
  lockedEventIds: ReadonlySet<string>;
  laneNoteHandlers: LaneNoteHandlers;
  onToggleVoice: (voice: VoiceId, checked: boolean) => void;
  onPlayVoice: (candidateId: string, voice: VoiceId) => void;
  onStop: () => void;
}

/**
 * The four voice lanes stacked on the shared time grid, with the harmonic
 * boundary through-lines drawn across them.
 */
export function LaneStack({
  candidate,
  playback,
  activeUnit,
  gridUnits,
  checkedVoices,
  editingEventId,
  lockedEventIds,
  laneNoteHandlers,
  onToggleVoice,
  onPlayVoice,
  onStop,
}: LaneStackProps) {
  // Same derivation as CandidateInspector's `playing`, re-stated here so the
  // alias narrows `playback` for the solo check below (candidate is non-null
  // by this component's props).
  const playing = playback.status === 'playing' && playback.candidateId === candidate.id;
  return (
    <div className={styles.laneStack}>
      {VOICES.map((voice) => (
        <VoiceLane
          key={voice}
          voice={voice}
          events={candidate.voicing[voice]}
          approach={candidate.approach?.voices[voice]}
          activeUnit={activeUnit}
          gridUnits={gridUnits}
          checked={checkedVoices.includes(voice)}
          onCheckedChange={(checked) => onToggleVoice(voice, checked)}
          soloing={playing && playback.voices.length === 1 && playback.voices[0] === voice}
          onPlayVoice={() => onPlayVoice(candidate.id, voice)}
          onStop={onStop}
          editingEventId={editingEventId}
          lockedEventIds={lockedEventIds}
          {...laneNoteHandlers(candidate, voice)}
        />
      ))}
      <BoundaryThroughLines harmonyEvents={candidate.harmonyEvents} gridUnits={gridUnits} />
    </div>
  );
}
