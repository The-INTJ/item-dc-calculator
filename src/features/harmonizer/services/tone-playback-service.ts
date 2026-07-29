/**
 * Tone.js implementation of PlaybackService (spec §18).
 *
 * - Tone is loaded via dynamic import on first play only — the module never
 *   executes during SSR or in jsdom tests.
 * - `Tone.start()` runs inside the click-handler call chain, satisfying
 *   browser autoplay policy (spec §18.2).
 * - All audio is scheduled up front against the Tone clock; the visual cursor
 *   uses timeouts (visual only, so minor drift is harmless).
 * - One restrained triangle timbre for all voices, gain + limiter so four
 *   simultaneous voices cannot clip (spec §18.3).
 */

import type * as ToneTypes from 'tone';
import type { CandidatePath } from '../domain/analysis-types';
import type { MelodyFragment, VoiceEvent } from '../domain/music-types';
import type { VoiceId } from '../domain/music-types';
import { toTimelineSpan, unitsToSeconds } from '../domain/timing';
import type { PlaybackCallbacks, PlaybackOptions, PlaybackService } from './playback-service';

interface ScheduledNote {
  midi: number;
  /** 0-based units from fragment start. */
  startUnit0: number;
  spanUnits: number;
}

const DEFAULT_TEMPO_BPM = 76;
const SCHEDULE_DELAY_SECONDS = 0.08;
/** Shorten notes slightly so adjacent harmonies don't smear (spec §18.2). */
const RELEASE_TRIM = 0.92;

function toNote(event: { pitch: { midi: number }; start: VoiceEvent['start']; duration: VoiceEvent['duration'] }): ScheduledNote {
  const span = toTimelineSpan(event.start, event.duration);
  return { midi: event.pitch.midi, startUnit0: span.startUnit - 1, spanUnits: span.spanUnits };
}

function startUnits(events: Array<{ start: VoiceEvent['start']; duration: VoiceEvent['duration'] }>): number[] {
  return events.map((event) => toTimelineSpan(event.start, event.duration).startUnit);
}

export class ToneJsPlaybackService implements PlaybackService {
  private readonly callbacks: PlaybackCallbacks;
  private tonePromise: Promise<typeof ToneTypes> | null = null;
  private synth: ToneTypes.PolySynth | null = null;
  private timeouts: number[] = [];
  private sessionId = 0;
  private loop = false;

  constructor(callbacks: PlaybackCallbacks = {}) {
    this.callbacks = callbacks;
  }

  async playMelody(fragment: MelodyFragment, options?: PlaybackOptions): Promise<void> {
    await this.playNotes(fragment.events.map(toNote), startUnits(fragment.events), options);
  }

  async playHarmony(candidate: CandidatePath, options?: PlaybackOptions): Promise<void> {
    // Reduction: at each harmony onset, snapshot the pitch sounding in every
    // voice and hold the block chord for the harmony's duration.
    const voices = [
      candidate.voicing.soprano,
      candidate.voicing.alto,
      candidate.voicing.tenor,
      candidate.voicing.bass,
    ];
    const notes: ScheduledNote[] = [];
    for (const harmony of candidate.harmonyEvents) {
      const span = toTimelineSpan(harmony.start, harmony.duration);
      for (const voiceEvents of voices) {
        const sounding = voiceEvents.find((event) => {
          const eventSpan = toTimelineSpan(event.start, event.duration);
          return (
            eventSpan.startUnit <= span.startUnit &&
            span.startUnit < eventSpan.startUnit + eventSpan.spanUnits
          );
        });
        if (sounding) {
          notes.push({
            midi: sounding.pitch.midi,
            startUnit0: span.startUnit - 1,
            spanUnits: span.spanUnits,
          });
        }
      }
    }
    await this.playNotes(notes, startUnits(candidate.harmonyEvents), options);
  }

  async playSATB(candidate: CandidatePath, options?: PlaybackOptions): Promise<void> {
    await this.playVoices(candidate, ['soprano', 'alto', 'tenor', 'bass'], options);
  }

  async playVoice(
    candidate: CandidatePath,
    voice: VoiceId,
    options?: PlaybackOptions,
  ): Promise<void> {
    await this.playVoices(candidate, [voice], options);
  }

  async playVoices(
    candidate: CandidatePath,
    voices: VoiceId[],
    options?: PlaybackOptions,
  ): Promise<void> {
    const events = [...new Set(voices)].flatMap((voice) => candidate.voicing[voice]);
    await this.playNotes(events.map(toNote), startUnits(events), options);
  }

  stop(): void {
    this.sessionId += 1;
    for (const timeout of this.timeouts) {
      window.clearTimeout(timeout);
    }
    this.timeouts = [];
    this.synth?.releaseAll();
  }

  private async ensureTone(): Promise<typeof ToneTypes> {
    this.tonePromise ??= import('tone');
    const tone = await this.tonePromise;
    if (!this.synth) {
      const limiter = new tone.Limiter(-3).toDestination();
      const volume = new tone.Volume(-6).connect(limiter);
      this.synth = new tone.PolySynth(tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.03, decay: 0.12, sustain: 0.65, release: 0.3 },
      }).connect(volume);
    }
    return tone;
  }

  private async playNotes(
    notes: ScheduledNote[],
    cursorUnits: number[],
    options?: PlaybackOptions,
  ): Promise<void> {
    this.stop(); // spec §9.10 — starting new playback stops the previous session
    if (notes.length === 0) return;
    const tone = await this.ensureTone();
    await tone.start(); // resume the AudioContext inside the user gesture
    this.loop = options?.loop ?? false;
    const tempoBpm = options?.tempoBpm ?? DEFAULT_TEMPO_BPM;
    const sessionId = this.sessionId;
    this.schedulePass(tone, notes, cursorUnits, tempoBpm, sessionId);
  }

  private schedulePass(
    tone: typeof ToneTypes,
    notes: ScheduledNote[],
    cursorUnits: number[],
    tempoBpm: number,
    sessionId: number,
  ): void {
    if (sessionId !== this.sessionId || !this.synth) return;
    const synth = this.synth;
    const now = tone.now() + SCHEDULE_DELAY_SECONDS;
    let totalSeconds = 0;

    for (const note of notes) {
      const startSeconds = unitsToSeconds(note.startUnit0, tempoBpm);
      const durationSeconds = unitsToSeconds(note.spanUnits, tempoBpm);
      totalSeconds = Math.max(totalSeconds, startSeconds + durationSeconds);
      synth.triggerAttackRelease(
        tone.Frequency(note.midi, 'midi').toFrequency(),
        durationSeconds * RELEASE_TRIM,
        now + startSeconds,
      );
    }

    const uniqueUnits = [...new Set(cursorUnits)].sort((a, b) => a - b);
    for (const unit of uniqueUnits) {
      const delayMs = (SCHEDULE_DELAY_SECONDS + unitsToSeconds(unit - 1, tempoBpm)) * 1000;
      this.timeouts.push(
        window.setTimeout(() => {
          if (sessionId === this.sessionId) this.callbacks.onCursor?.(unit);
        }, delayMs),
      );
    }

    const endMs = (SCHEDULE_DELAY_SECONDS + totalSeconds) * 1000;
    this.timeouts.push(
      window.setTimeout(() => {
        if (sessionId !== this.sessionId) return;
        this.callbacks.onCursor?.(null);
        if (this.loop) {
          this.schedulePass(tone, notes, cursorUnits, tempoBpm, sessionId);
        } else {
          this.callbacks.onEnded?.();
        }
      }, endMs),
    );
  }
}
