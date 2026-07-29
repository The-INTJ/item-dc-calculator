'use client';

import { useEffect, useRef, useState } from 'react';
import { content } from '../content';
import type { CandidatePath } from '../domain/analysis-types';
import type { VoiceEvent, VoiceId } from '../domain/music-types';
import { tonicWholeNoteFragment } from '../domain/scale';
import { getDefaultFixture, getFixtureById } from '../fixtures/registry';
import {
  createProject,
  getActiveProject,
  readProjects,
  saveWorkbench,
  setActiveProject,
  toPersistedWorkbench,
  type HarmonizerProject,
} from '../projects/project-store';
import {
  DEFAULT_INSTRUMENT_ID,
  INSTRUMENTS,
  type InstrumentId,
} from '../services/instruments';
import type { PlaybackService } from '../services/playback-service';
import type { WorkbenchAction } from '../state/actions';
import { ProjectSwitcher, type SaveIndicator } from './header/ProjectSwitcher';
import { NextFragmentChooser } from './samples/NextFragmentChooser';
import { newId } from './shared/ids';
import { ToneJsPlaybackService } from '../services/tone-playback-service';
import { getSelectedCandidate, toCandidatePathSummary } from '../state/selectors';
import { createInitialWorkbenchState, useWorkbenchReducer } from '../state/workbenchReducer';
import { CandidatePalette } from './candidates/CandidatePalette';
import { ContextBar } from './context-bar/ContextBar';
import { AcceptedContextRail } from './context-rail/AcceptedContextRail';
import { CandidateInspector } from './inspector/CandidateInspector';
import { WorkbenchHeader } from './WorkbenchHeader';
import styles from './HarmonizationWorkbench.module.scss';

const ALL_VOICES: VoiceId[] = ['soprano', 'alto', 'tenor', 'bass'];

interface LastPlay {
  candidateId: string;
  voices: VoiceId[];
}

export function HarmonizationWorkbench() {
  const [state, dispatch] = useWorkbenchReducer(getDefaultFixture());
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [checkedVoices, setCheckedVoices] = useState<VoiceId[]>(ALL_VOICES);
  const [chooserOpen, setChooserOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [saveIndicator, setSaveIndicator] = useState<SaveIndicator>(null);
  const [soundId, setSoundId] = useState<InstrumentId>(DEFAULT_INSTRUMENT_ID);
  const serviceRef = useRef<PlaybackService | null>(null);
  const lastPlayRef = useRef<LastPlay | null>(null);

  const playback = state.playback;
  const activeUnit = playback.status === 'playing' ? playback.activeUnit : null;
  const selectedCandidate = getSelectedCandidate(state);
  const selectedIndex = state.candidates.findIndex(
    (candidate) => candidate.id === state.selectedCandidateId,
  );
  const candidateLetter = selectedIndex >= 0 ? String.fromCharCode(65 + selectedIndex) : null;

  function getService(): PlaybackService {
    if (!serviceRef.current) {
      serviceRef.current = new ToneJsPlaybackService({
        onCursor: (unit) => dispatch({ type: 'PLAYBACK_PROGRESS', activeUnit: unit }),
        onEnded: () => dispatch({ type: 'STOP_PLAYBACK' }),
      });
      serviceRef.current.setInstrument(soundId);
    }
    return serviceRef.current;
  }

  function changeSound(id: InstrumentId) {
    setSoundId(id);
    serviceRef.current?.setInstrument(id);
    if (playback.status === 'playing') stopPlayback();
    try {
      window.localStorage.setItem('harmonizer.sound.v1', id);
    } catch {
      // storage unavailable — the choice just won't persist
    }
  }

  function findCandidate(candidateId: string): CandidatePath | null {
    return state.candidates.find((candidate) => candidate.id === candidateId) ?? null;
  }

  async function startPlayback(
    candidateId: string,
    voices: VoiceId[],
    loopOverride?: boolean,
  ): Promise<void> {
    if (voices.length === 0) return;
    const candidate = findCandidate(candidateId);
    if (!candidate) return;
    const service = getService();
    const options = { tempoBpm: state.tempoBpm, loop: loopOverride ?? loopEnabled };
    lastPlayRef.current = { candidateId, voices };
    dispatch({ type: 'START_PLAYBACK', candidateId, voices });
    try {
      await service.playVoices(candidate, voices, options);
    } catch (error) {
      console.error('[harmonizer] playback failed', error);
      dispatch({ type: 'STOP_PLAYBACK' });
    }
  }

  function stopPlayback() {
    serviceRef.current?.stop();
    dispatch({ type: 'STOP_PLAYBACK' });
  }

  /** Structural changes replace candidates — stop any running audio first. */
  function dispatchStructural(action: WorkbenchAction) {
    if (playback.status === 'playing') stopPlayback();
    dispatch(action);
  }

  function toggleVoice(voice: VoiceId, checked: boolean) {
    setCheckedVoices((previous) =>
      checked
        ? ALL_VOICES.filter((candidate) => previous.includes(candidate) || candidate === voice)
        : previous.filter((candidate) => candidate !== voice),
    );
  }

  const lockedEventIds = new Set(
    state.locks
      .filter(
        (lock) =>
          lock.targetType === 'voice_event' && lock.candidateId === state.selectedCandidateId,
      )
      .map((lock) => lock.targetId),
  );

  function toggleNoteLock(candidateId: string, event: VoiceEvent) {
    dispatchStructural({
      type: 'TOGGLE_LOCK',
      lock: {
        id: `lock-${event.id}`,
        targetType: 'voice_event',
        targetId: event.id,
        candidateId,
        valueSnapshot: event,
        createdAt: new Date().toISOString(),
      },
    });
  }

  function applySelected() {
    if (!selectedCandidate) return;
    dispatchStructural({ type: 'APPLY_CANDIDATE', appliedId: newId() });
    setChooserOpen(true);
  }

  function pickNextFragment(choice: { kind: 'fixture'; fixtureId: string } | { kind: 'blank' }) {
    setChooserOpen(false);
    if (choice.kind === 'fixture') {
      const fixture = getFixtureById(choice.fixtureId);
      if (fixture) {
        dispatchStructural({
          type: 'LOAD_SAMPLE',
          source: { kind: 'fixture', fixture },
          keepAcceptedContext: true,
        });
      }
      return;
    }
    const fragment = tonicWholeNoteFragment(state.tonalContext, newId(), newId());
    if (fragment) {
      dispatchStructural({
        type: 'LOAD_SAMPLE',
        source: { kind: 'blank', fragment },
        keepAcceptedContext: true,
      });
    }
  }

  function restoreSample() {
    const fixture =
      (state.sourceFixtureId ? getFixtureById(state.sourceFixtureId) : null) ??
      getDefaultFixture();
    dispatchStructural({
      type: 'LOAD_SAMPLE',
      source: { kind: 'fixture', fixture },
      keepAcceptedContext: false,
    });
  }

  function resizeNote(
    candidateId: string,
    voice: VoiceId,
    eventId: string,
    edge: 'left' | 'right',
    targetBoundary: number,
    ripple: boolean,
    gestureId: string,
  ) {
    dispatch({
      type: 'RESIZE_VOICE_EVENT',
      candidateId,
      voice,
      eventId,
      edge,
      targetBoundary,
      ripple,
      gestureId,
    });
  }

  function handleToggleLoop() {
    const next = !loopEnabled;
    setLoopEnabled(next);
    // Restart the current session so the toggle takes effect immediately.
    if (playback.status === 'playing' && lastPlayRef.current) {
      const last = lastPlayRef.current;
      void startPlayback(last.candidateId, last.voices, next);
    }
  }

  // Space plays/stops the checked parts of the selected reading when focus
  // isn't in a control (spec §24).
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.code !== 'Space') return;
      const target = event.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (
          tag === 'INPUT' ||
          tag === 'SELECT' ||
          tag === 'TEXTAREA' ||
          tag === 'BUTTON' ||
          target.isContentEditable
        ) {
          return;
        }
      }
      event.preventDefault();
      if (playback.status === 'playing') {
        stopPlayback();
      } else if (selectedCandidate) {
        void startPlayback(selectedCandidate.id, checkedVoices);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  // Stop audio when the workbench unmounts.
  useEffect(() => {
    return () => {
      serviceRef.current?.stop();
    };
  }, []);

  // Post-mount hydration: SSR/first paint always renders the default fixture
  // (deterministic — zero hydration risk); the active project loads as an
  // explicit action once localStorage is readable. First visit auto-creates a
  // project (guarded so StrictMode's double effect can't create two).
  useEffect(() => {
    const active = getActiveProject();
    if (active) {
      dispatch({ type: 'LOAD_PROJECT', workbench: active.workbench });
    } else if (readProjects().projects.length === 0) {
      createProject(content.projects.untitled, toPersistedWorkbench(state));
    }
    const storedSound = window.localStorage.getItem('harmonizer.sound.v1');
    if (storedSound && INSTRUMENTS.some((instrument) => instrument.id === storedSound)) {
      setSoundId(storedSound as InstrumentId);
      serviceRef.current?.setInstrument(storedSound as InstrumentId);
    }
    setHydrated(true);
  }, []);

  // Debounced autosave. Deps are the individual persisted field references so
  // playback ticks and history churn never trigger a save.
  useEffect(() => {
    if (!hydrated) return;
    const activeId = readProjects().activeProjectId;
    if (!activeId) return;
    setSaveIndicator('saving');
    const timeout = window.setTimeout(() => {
      setSaveIndicator(saveWorkbench(activeId, toPersistedWorkbench(state)));
    }, 800);
    return () => window.clearTimeout(timeout);
  }, [
    hydrated,
    state.tonalContext,
    state.phraseIntent,
    state.tempoBpm,
    state.acceptedContext,
    state.appliedFragments,
    state.fragment,
    state.boundaryConstraints,
    state.suggestionStatus,
    state.suggestionSource,
    state.sourceFixtureId,
    state.candidateSetId,
    state.candidates,
    state.selectedCandidateId,
    state.locks,
  ]);

  function flushSave() {
    const activeId = readProjects().activeProjectId;
    if (hydrated && activeId) {
      saveWorkbench(activeId, toPersistedWorkbench(state));
    }
  }

  function switchProject(project: HarmonizerProject) {
    flushSave();
    setActiveProject(project.id);
    dispatchStructural({ type: 'LOAD_PROJECT', workbench: project.workbench });
  }

  function newProject() {
    flushSave();
    const fresh = toPersistedWorkbench(createInitialWorkbenchState(getDefaultFixture()));
    createProject(content.projects.untitled, fresh);
    dispatchStructural({ type: 'LOAD_PROJECT', workbench: fresh });
  }

  function afterActiveDeleted(next: HarmonizerProject | null) {
    // No flush — the deleted project's state must not leak into the fallback.
    if (next) {
      dispatchStructural({ type: 'LOAD_PROJECT', workbench: next.workbench });
    } else {
      const fresh = toPersistedWorkbench(createInitialWorkbenchState(getDefaultFixture()));
      createProject(content.projects.untitled, fresh);
      dispatchStructural({ type: 'LOAD_PROJECT', workbench: fresh });
    }
  }

  const announcement =
    playback.status === 'playing'
      ? playback.voices.length === ALL_VOICES.length
        ? content.playback.playingAll
        : `${content.playback.playingPrefix} ${playback.voices
            .map((voice) => content.inspector.voiceLabels[voice])
            .join(' + ')}`
      : content.playback.stopped;

  return (
    <div className={styles.workbench}>
      <div className={styles.inner}>
        <WorkbenchHeader
          canUndo={state.history.length > 0}
          canRedo={state.future.length > 0}
          onUndo={() => dispatchStructural({ type: 'UNDO' })}
          onRedo={() => dispatchStructural({ type: 'REDO' })}
          projectSlot={
            hydrated ? (
              <ProjectSwitcher
                saveIndicator={saveIndicator}
                onSwitch={switchProject}
                onNew={newProject}
                onActiveDeleted={afterActiveDeleted}
              />
            ) : null
          }
        />
        <ContextBar
          tonalContext={state.tonalContext}
          phraseIntent={state.phraseIntent}
          tempoBpm={state.tempoBpm}
          currentFixtureId={state.sourceFixtureId}
          soundId={soundId}
          onSoundChange={changeSound}
          onTempoChange={(tempoBpm) => dispatch({ type: 'SET_TEMPO', tempoBpm })}
          onKeyChange={(tonalContext) =>
            dispatchStructural({ type: 'EDIT_TONAL_CONTEXT', tonalContext })
          }
          onIntentChange={(phraseIntent) =>
            dispatchStructural({ type: 'EDIT_PHRASE_INTENT', phraseIntent })
          }
          onLoadSample={(fixtureId) => {
            const fixture = getFixtureById(fixtureId);
            if (fixture) {
              dispatchStructural({
                type: 'LOAD_SAMPLE',
                source: { kind: 'fixture', fixture },
                keepAcceptedContext: false,
              });
            }
          }}
        />
        <section className={styles.region}>
          <AcceptedContextRail
            acceptedContext={state.acceptedContext}
            appliedFragments={state.appliedFragments}
            tonalContext={state.tonalContext}
            onSetAcceptedHarmony={(harmony) =>
              dispatchStructural({ type: 'SET_ACCEPTED_HARMONY', harmony })
            }
          />
        </section>
        <section className={styles.regionNotes}>
          <CandidateInspector
            candidate={selectedCandidate}
            candidateLetter={candidateLetter}
            fragment={state.fragment}
            playback={playback}
            loopEnabled={loopEnabled}
            checkedVoices={checkedVoices}
            lockedEventIds={lockedEventIds}
            suggestionSource={state.suggestionSource}
            onToggleVoice={toggleVoice}
            onPlayChecked={() => {
              if (selectedCandidate) void startPlayback(selectedCandidate.id, checkedVoices);
            }}
            onPlayVoice={(candidateId, voice) => void startPlayback(candidateId, [voice])}
            onStop={stopPlayback}
            onToggleLoop={handleToggleLoop}
            onToggleNoteLock={toggleNoteLock}
            onStepNote={(candidateId, voice, eventId, direction) =>
              dispatchStructural({
                type: 'STEP_VOICE_EVENT_PITCH',
                candidateId,
                voice,
                eventId,
                direction,
              })
            }
            onInsertNote={(candidateId, voice, neighborEventId, side, newEventId) =>
              dispatchStructural({
                type: 'INSERT_VOICE_EVENT',
                candidateId,
                voice,
                neighborEventId,
                side,
                newEventId,
              })
            }
            onDeleteNote={(candidateId, voice, eventId) =>
              dispatchStructural({ type: 'DELETE_VOICE_EVENT', candidateId, voice, eventId })
            }
            onApply={applySelected}
            onResizeNote={resizeNote}
          />
        </section>
        <section className={styles.region}>
          <CandidatePalette
            summaries={state.candidates.map(toCandidatePathSummary)}
            selectedCandidateId={state.selectedCandidateId}
            suggestionStatus={state.suggestionStatus}
            playback={playback}
            onSelect={(candidateId) => dispatch({ type: 'SELECT_CANDIDATE', candidateId })}
            onPlayFull={(candidateId) => void startPlayback(candidateId, ALL_VOICES)}
            onStop={stopPlayback}
            onRestoreSample={restoreSample}
          />
        </section>
        <div aria-live="polite" className={styles.visuallyHidden}>
          {announcement}
        </div>
        <NextFragmentChooser
          open={chooserOpen}
          onClose={() => setChooserOpen(false)}
          onPick={pickNextFragment}
        />
      </div>
    </div>
  );
}
