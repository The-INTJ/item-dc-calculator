/**
 * Playback implementation with swappable instruments (the Sound toggle).
 *
 * Engines:
 * - 'tone': Tone.js PolySynth patches (instant, offline). The default is an
 *   organ-principal patch whose partials are all octaves of the fundamental,
 *   so low bass reads as exactly one pitch.
 * - 'smplr': sampled instruments (piano / GM soundfonts) fetched over the
 *   network on first use. Load failure falls back to the default synth.
 *
 * Everything loads via dynamic import on first play — never during SSR or in
 * jsdom tests. All audio is scheduled up front against the engine's clock;
 * the visual cursor uses timeouts (visual only).
 *
 * Gain staging: per-voice velocities + patch volume keep the summed peak a
 * few dB under the Limiter(-1) so it acts as a safety net, never a
 * compressor — an engaged limiter with a fast release amplitude-modulates
 * the mix at the bass frequency, which reads as grit on full chords.
 */

import type { CandidatePath } from '../domain/analysis-types';
import type { MelodyFragment, VoiceId } from '../domain/music-types';
import { toTimelineSpan, unitsToSeconds } from '../domain/timing';
import {
  SCHEDULE_DELAY_SECONDS,
  type ActiveInstrument,
  type TimedNote,
} from './instrument-engines';
import { InstrumentLoader } from './instrument-loading';
import {
  DEFAULT_INSTRUMENT_ID,
  FALLBACK_INSTRUMENT_ID,
  getInstrumentDef,
  type InstrumentId,
} from './instruments';
import type { PlaybackCallbacks, PlaybackOptions, PlaybackService } from './playback-service';
import { startUnits, toNote, VOICE_VELOCITY, type ScheduledNote } from './scheduled-notes';

const DEFAULT_TEMPO_BPM = 76;

/* ---------- service ---------- */

export class ToneJsPlaybackService implements PlaybackService {
  private readonly callbacks: PlaybackCallbacks;
  private readonly loader = new InstrumentLoader();
  private readonly instruments = new Map<InstrumentId, ActiveInstrument>();
  private desiredInstrumentId: InstrumentId = DEFAULT_INSTRUMENT_ID;
  private timeouts: number[] = [];
  private sessionId = 0;
  private loop = false;

  constructor(callbacks: PlaybackCallbacks = {}) {
    this.callbacks = callbacks;
  }

  setInstrument(id: InstrumentId): void {
    this.desiredInstrumentId = id;
  }

  async playMelody(fragment: MelodyFragment, options?: PlaybackOptions): Promise<void> {
    await this.playNotes(
      fragment.events.map((event) => toNote(event, VOICE_VELOCITY.soprano)),
      startUnits(fragment.events),
      options,
    );
  }

  async playHarmony(candidate: CandidatePath, options?: PlaybackOptions): Promise<void> {
    const voiceIds: VoiceId[] = ['soprano', 'alto', 'tenor', 'bass'];
    const notes: ScheduledNote[] = [];
    for (const harmony of candidate.harmonyEvents) {
      const span = toTimelineSpan(harmony.start, harmony.duration);
      for (const voice of voiceIds) {
        const sounding = candidate.voicing[voice].find((event) => {
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
            velocity: VOICE_VELOCITY[voice],
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
    const uniqueVoices = [...new Set(voices)];
    const notes = uniqueVoices.flatMap((voice) =>
      candidate.voicing[voice].map((event) => toNote(event, VOICE_VELOCITY[voice])),
    );
    const events = uniqueVoices.flatMap((voice) => candidate.voicing[voice]);
    await this.playNotes(notes, startUnits(events), options);
  }

  stop(): void {
    this.sessionId += 1;
    for (const timeout of this.timeouts) {
      window.clearTimeout(timeout);
    }
    this.timeouts = [];
    for (const instrument of this.instruments.values()) {
      instrument.stopAll();
    }
  }

  /** Load (or reuse) the selected instrument; fall back to the offline synth. */
  private async ensureInstrument(): Promise<ActiveInstrument> {
    const def = getInstrumentDef(this.desiredInstrumentId);
    const cached = this.instruments.get(def.id);
    if (cached) return cached;
    try {
      const instrument = await this.loader.build(def);
      this.instruments.set(def.id, instrument);
      return instrument;
    } catch (error) {
      console.warn(`[harmonizer] instrument "${def.id}" failed to load; falling back`, error);
      if (def.id !== FALLBACK_INSTRUMENT_ID) {
        this.desiredInstrumentId = FALLBACK_INSTRUMENT_ID;
        return this.ensureInstrument();
      }
      throw error;
    }
  }

  private async playNotes(
    notes: ScheduledNote[],
    cursorUnits: number[],
    options?: PlaybackOptions,
  ): Promise<void> {
    this.stop(); // spec §9.10 — starting new playback stops the previous session
    if (notes.length === 0) return;
    const instrument = await this.ensureInstrument();
    await instrument.resume(); // inside the user gesture
    this.loop = options?.loop ?? false;
    const tempoBpm = options?.tempoBpm ?? DEFAULT_TEMPO_BPM;
    const sessionId = this.sessionId;
    this.schedulePass(instrument, notes, cursorUnits, tempoBpm, sessionId);
  }

  private schedulePass(
    instrument: ActiveInstrument,
    notes: ScheduledNote[],
    cursorUnits: number[],
    tempoBpm: number,
    sessionId: number,
  ): void {
    if (sessionId !== this.sessionId) return;
    let totalSeconds = 0;
    const timed: TimedNote[] = notes.map((note) => {
      const startSec = unitsToSeconds(note.startUnit0, tempoBpm);
      const durationSec = unitsToSeconds(note.spanUnits, tempoBpm);
      totalSeconds = Math.max(totalSeconds, startSec + durationSec);
      return { midi: note.midi, startSec, durationSec, velocity: note.velocity };
    });
    instrument.scheduleNotes(timed);

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
          this.schedulePass(instrument, notes, cursorUnits, tempoBpm, sessionId);
        } else {
          this.callbacks.onEnded?.();
        }
      }, endMs),
    );
  }
}
