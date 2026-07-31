'use client';

import { useEffect, useRef, useState, type Dispatch } from 'react';
import { content } from '../content';
import type { CandidatePath } from '../domain/analysis-types';
import {
  appliedIdAtUnit,
  compositionCandidate,
  COMPOSITION_CANDIDATE_ID,
} from '../domain/composition';
import type { VoiceId } from '../domain/music-types';
import type { PlaybackState, WorkbenchState } from '../domain/workbench-state';
import {
  DEFAULT_INSTRUMENT_ID,
  INSTRUMENTS,
  type InstrumentId,
} from '../services/instruments';
import type { PlaybackService } from '../services/playback-service';
import { ToneJsPlaybackService } from '../services/tone-playback-service';
import type { WorkbenchAction } from '../state/actions';

export const ALL_VOICES: VoiceId[] = ['soprano', 'alto', 'tenor', 'bass'];

interface LastPlay {
  candidateId: string;
  voices: VoiceId[];
}

/** The audio surface of the workbench: transport, sound choice, and the structural-dispatch guard. */
export interface WorkbenchPlayback {
  soundId: InstrumentId;
  changeSound: (id: InstrumentId) => void;
  restoreStoredSound: () => void;
  startPlayback: (candidateId: string, voices: VoiceId[]) => Promise<void>;
  startPlaybackOf: (candidate: CandidatePath, voices: VoiceId[]) => Promise<void>;
  stopPlayback: () => void;
  dispatchStructural: (action: WorkbenchAction) => void;
}

function createPlaybackService(
  dispatch: Dispatch<WorkbenchAction>,
  soundId: InstrumentId,
): PlaybackService {
  const service = new ToneJsPlaybackService({
    onCursor: (unit) => dispatch({ type: 'PLAYBACK_PROGRESS', activeUnit: unit }),
    onEnded: () => dispatch({ type: 'STOP_PLAYBACK' }),
  });
  service.setInstrument(soundId);
  return service;
}

export function useWorkbenchPlayback(
  state: WorkbenchState,
  dispatch: Dispatch<WorkbenchAction>,
): WorkbenchPlayback {
  const [soundId, setSoundId] = useState<InstrumentId>(DEFAULT_INSTRUMENT_ID);
  const serviceRef = useRef<PlaybackService | null>(null);
  const lastPlayRef = useRef<LastPlay | null>(null);
  const playback = state.playback;

  function getService(): PlaybackService {
    if (!serviceRef.current) serviceRef.current = createPlaybackService(dispatch, soundId);
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

  function restoreStoredSound() {
    const storedSound = window.localStorage.getItem('harmonizer.sound.v1');
    if (storedSound && INSTRUMENTS.some((instrument) => instrument.id === storedSound)) {
      setSoundId(storedSound as InstrumentId);
      serviceRef.current?.setInstrument(storedSound as InstrumentId);
    }
  }

  function findCandidate(candidateId: string): CandidatePath | null {
    return state.candidates.find((candidate) => candidate.id === candidateId) ?? null;
  }

  async function startPlayback(candidateId: string, voices: VoiceId[]): Promise<void> {
    const candidate = findCandidate(candidateId);
    if (!candidate) return;
    await startPlaybackOf(candidate, voices);
  }

  /**
   * Play any reading, including ones that are not in the candidate list — the
   * whole-hymn projection and single applied pieces are built on the fly.
   */
  async function startPlaybackOf(candidate: CandidatePath, voices: VoiceId[]): Promise<void> {
    if (voices.length === 0) return;
    const candidateId = candidate.id;
    const service = getService();
    const options = { tempoBpm: state.tempoBpm, loop: false };
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

  // Stop audio when the workbench unmounts.
  useEffect(() => {
    return () => {
      serviceRef.current?.stop();
    };
  }, []);

  return {
    soundId,
    changeSound,
    restoreStoredSound,
    startPlayback,
    startPlaybackOf,
    stopPlayback,
    dispatchStructural,
  };
}

/* ---------- the composition (applied pieces) ---------- */

export function useCompositionPlayback(state: WorkbenchState, pb: WorkbenchPlayback) {
  const playback = state.playback;
  const hymn = compositionCandidate(state.appliedFragments);
  const hymnPlaying =
    playback.status === 'playing' && playback.candidateId === COMPOSITION_CANDIDATE_ID;
  const soundingAppliedId = hymnPlaying
    ? appliedIdAtUnit(state.appliedFragments, playback.activeUnit)
    : null;

  function playHymn() {
    if (hymn) void pb.startPlaybackOf(hymn, ALL_VOICES);
  }

  function playApplied(appliedId: string) {
    const applied = state.appliedFragments.find((entry) => entry.id === appliedId);
    if (applied) void pb.startPlaybackOf(applied.candidate, ALL_VOICES);
  }

  return { hymnPlaying, soundingAppliedId, playHymn, playApplied };
}

export function playbackAnnouncement(playback: PlaybackState): string {
  return playback.status === 'playing'
    ? playback.voices.length === ALL_VOICES.length
      ? content.playback.playingAll
      : `${content.playback.playingPrefix} ${playback.voices
          .map((voice) => content.inspector.voiceLabels[voice])
          .join(' + ')}`
    : content.playback.stopped;
}
