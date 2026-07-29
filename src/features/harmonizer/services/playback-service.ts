/**
 * Playback service boundary — spec §18.1, method signatures verbatim.
 *
 * The UI depends only on this contract. Each play method resolves once
 * scheduling has begun (not when audio finishes); completion is reported via
 * PlaybackCallbacks.onEnded. Starting any playback stops the previous session
 * (spec §9.10).
 */

import type { CandidatePath } from '../domain/analysis-types';
import type { MelodyFragment, VoiceId } from '../domain/music-types';

export interface PlaybackOptions {
  tempoBpm?: number;
  loop?: boolean;
}

export interface PlaybackCallbacks {
  /** 1-based timeline unit the cursor entered; null between loop passes. */
  onCursor?: (activeUnit: number | null) => void;
  /** Fired when a non-looping session reaches its end (not on manual stop). */
  onEnded?: () => void;
}

import type { InstrumentId } from './instruments';

export interface PlaybackService {
  playMelody(fragment: MelodyFragment, options?: PlaybackOptions): Promise<void>;
  playHarmony(candidate: CandidatePath, options?: PlaybackOptions): Promise<void>;
  playSATB(candidate: CandidatePath, options?: PlaybackOptions): Promise<void>;
  playVoice(candidate: CandidatePath, voice: VoiceId, options?: PlaybackOptions): Promise<void>;
  /** Play an arbitrary subset of voices together — the UI's primary entry point. */
  playVoices(
    candidate: CandidatePath,
    voices: VoiceId[],
    options?: PlaybackOptions,
  ): Promise<void>;
  /** Choose the sound for subsequent playback (loaded lazily on first use). */
  setInstrument(id: InstrumentId): void;
  stop(): void;
}
