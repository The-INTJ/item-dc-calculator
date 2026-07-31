'use client';

import { getDefaultFixture } from '../fixtures/registry';
import { getSelectedCandidate, toCandidatePathSummary } from '../state/selectors';
import { useWorkbenchReducer } from '../state/workbenchReducer';
import { CandidatePalette } from './candidates/CandidatePalette';
import { ContextBar } from './context-bar/ContextBar';
import { AcceptedContextRail } from './context-rail/AcceptedContextRail';
import { ProjectSwitcher } from './header/ProjectSwitcher';
import { InspectorSection } from './InspectorSection';
import { useProjectPersistence } from './useProjectPersistence';
import { useVoiceEventEditing } from './useVoiceEventEditing';
import { useVoiceSelection } from './useVoiceSelection';
import { useWorkbenchCommands } from './useWorkbenchCommands';
import {
  playbackAnnouncement,
  useCompositionPlayback,
  useWorkbenchPlayback,
} from './useWorkbenchPlayback';
import { WorkbenchHeader } from './WorkbenchHeader';
import styles from './HarmonizationWorkbench.module.scss';

export function HarmonizationWorkbench() {
  const [state, dispatch] = useWorkbenchReducer(getDefaultFixture());
  const playback = state.playback;
  const activeUnit = playback.status === 'playing' ? playback.activeUnit : null;
  const selectedCandidate = getSelectedCandidate(state);
  const pb = useWorkbenchPlayback(state, dispatch);
  const voices = useVoiceSelection(playback, selectedCandidate, pb);
  const composition = useCompositionPlayback(state, pb);
  const editing = useVoiceEventEditing(state, dispatch, pb.dispatchStructural);
  const commands = useWorkbenchCommands(state, dispatch, pb.dispatchStructural);
  const persistence = useProjectPersistence(state, dispatch, pb);
  const announcement = playbackAnnouncement(playback);

  return (
    // data-glossary-boundary: the edge glossary tips must not overflow (Term.tsx).
    <div className={styles.workbench} data-glossary-boundary>
      <div className={styles.inner}>
        <WorkbenchHeader
          canUndo={state.history.length > 0}
          canRedo={state.future.length > 0}
          onUndo={commands.undo}
          onRedo={commands.redo}
          projectSlot={
            persistence.hydrated ? <ProjectSwitcher {...persistence.switcherProps} /> : null
          }
        />
        <ContextBar
          tonalContext={state.tonalContext}
          tempoBpm={state.tempoBpm}
          currentFixtureId={state.sourceFixtureId}
          soundId={pb.soundId}
          onSoundChange={pb.changeSound}
          onTempoChange={commands.changeTempo}
          onKeyChange={commands.changeKey}
          onLoadSample={commands.loadSample}
        />
        <section className={styles.region}>
          <AcceptedContextRail
            appliedFragments={state.appliedFragments}
            selectedMeasureId={state.selectedMeasureId}
            soundingAppliedId={composition.soundingAppliedId}
            hymnPlaying={composition.hymnPlaying}
            canAddMeasure={state.appliedFragments.length > 0}
            onPlayHymn={composition.playHymn}
            onPlayApplied={composition.playApplied}
            onSelectMeasure={commands.selectMeasure}
            onAddMeasure={commands.addMeasure}
            onStop={pb.stopPlayback}
          />
        </section>
        <InspectorSection
          state={state}
          selectedCandidate={selectedCandidate}
          voices={voices}
          editing={editing}
          onStop={pb.stopPlayback}
        />
        <section className={styles.region}>
          <CandidatePalette
            summaries={state.candidates.map(toCandidatePathSummary)}
            selectedCandidateId={state.selectedCandidateId}
            suggestionStatus={state.suggestionStatus}
            playback={playback}
            phraseIntent={state.phraseIntent}
            onIntentChange={commands.changeIntent}
            onSelect={commands.selectCandidate}
            onPlayFull={voices.playFull}
            onStop={pb.stopPlayback}
            onRestoreSample={commands.restoreSample}
          />
        </section>
        <div aria-live="polite" className={styles.visuallyHidden}>
          {announcement}
        </div>
      </div>
    </div>
  );
}
