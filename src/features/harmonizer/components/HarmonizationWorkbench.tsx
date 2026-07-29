'use client';

import { useEffect, useRef, useState } from 'react';
import { content } from '../content';
import type { CandidatePath } from '../domain/analysis-types';
import type { VoiceId } from '../domain/music-types';
import { getDefaultFixture } from '../fixtures/registry';
import type { PlaybackService } from '../services/playback-service';
import { ToneJsPlaybackService } from '../services/tone-playback-service';
import { getSelectedCandidate, toCandidatePathSummary } from '../state/selectors';
import { useWorkbenchReducer } from '../state/workbenchReducer';
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
    serviceRef.current ??= new ToneJsPlaybackService({
      onCursor: (unit) => dispatch({ type: 'PLAYBACK_PROGRESS', activeUnit: unit }),
      onEnded: () => dispatch({ type: 'STOP_PLAYBACK' }),
    });
    return serviceRef.current;
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

  function toggleVoice(voice: VoiceId, checked: boolean) {
    setCheckedVoices((previous) =>
      checked
        ? ALL_VOICES.filter((candidate) => previous.includes(candidate) || candidate === voice)
        : previous.filter((candidate) => candidate !== voice),
    );
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
        <WorkbenchHeader />
        <ContextBar
          tonalContext={state.tonalContext}
          phraseIntent={state.phraseIntent}
          tempoBpm={state.tempoBpm}
          onTempoChange={(tempoBpm) => dispatch({ type: 'SET_TEMPO', tempoBpm })}
        />
        <section className={styles.region}>
          <AcceptedContextRail acceptedContext={state.acceptedContext} />
        </section>
        <section className={styles.region}>
          <CandidateInspector
            candidate={selectedCandidate}
            candidateLetter={candidateLetter}
            fragment={state.fragment}
            boundaryConstraints={state.boundaryConstraints}
            playback={playback}
            loopEnabled={loopEnabled}
            checkedVoices={checkedVoices}
            onToggleVoice={toggleVoice}
            onPlayChecked={() => {
              if (selectedCandidate) void startPlayback(selectedCandidate.id, checkedVoices);
            }}
            onPlayVoice={(candidateId, voice) => void startPlayback(candidateId, [voice])}
            onStop={stopPlayback}
            onToggleLoop={handleToggleLoop}
          />
        </section>
        <section className={styles.region}>
          <CandidatePalette
            summaries={state.candidates.map(toCandidatePathSummary)}
            selectedCandidateId={state.selectedCandidateId}
            playback={playback}
            onSelect={(candidateId) => dispatch({ type: 'SELECT_CANDIDATE', candidateId })}
            onPlayFull={(candidateId) => void startPlayback(candidateId, ALL_VOICES)}
            onStop={stopPlayback}
          />
        </section>
        <div aria-live="polite" className={styles.visuallyHidden}>
          {announcement}
        </div>
      </div>
    </div>
  );
}
