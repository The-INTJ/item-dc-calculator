'use client';

import type { CandidatePath } from '../domain/analysis-types';
import type { WorkbenchState } from '../domain/workbench-state';
import { CandidateInspector } from './inspector/CandidateInspector';
import type { useVoiceEventEditing } from './useVoiceEventEditing';
import type { useVoiceSelection } from './useVoiceSelection';
import styles from './HarmonizationWorkbench.module.scss';

interface InspectorSectionProps {
  state: WorkbenchState;
  selectedCandidate: CandidatePath | null;
  voices: ReturnType<typeof useVoiceSelection>;
  editing: ReturnType<typeof useVoiceEventEditing>;
  onStop: () => void;
}

/** The notes panel: the selected reading's editor in the workbench's middle region. */
export function InspectorSection({
  state,
  selectedCandidate,
  voices,
  editing,
  onStop,
}: InspectorSectionProps) {
  return (
    <section className={styles.regionNotes}>
      <CandidateInspector
        candidate={selectedCandidate}
        fragment={state.fragment}
        playback={state.playback}
        checkedVoices={voices.checkedVoices}
        lockedEventIds={editing.lockedEventIds}
        suggestionSource={state.suggestionSource}
        onToggleVoice={voices.toggleVoice}
        onPlayChecked={voices.playChecked}
        onPlayVoice={voices.playVoice}
        onStop={onStop}
        onToggleNoteLock={editing.toggleNoteLock}
        onStepNote={editing.stepNote}
        onInsertNote={editing.insertNote}
        onDeleteNote={editing.deleteNote}
        onResizeNote={editing.resizeNote}
      />
    </section>
  );
}
