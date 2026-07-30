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

import type * as ToneTypes from 'tone';
import type { CandidatePath } from '../domain/analysis-types';
import type { MelodyFragment, VoiceEvent } from '../domain/music-types';
import type { VoiceId } from '../domain/music-types';
import { toTimelineSpan, unitsToSeconds } from '../domain/timing';
import {
  DEFAULT_INSTRUMENT_ID,
  FALLBACK_INSTRUMENT_ID,
  getInstrumentDef,
  noteLengthFor,
  type InstrumentDef,
  type InstrumentId,
  type ToneInstrumentConfig,
} from './instruments';
import type { PlaybackCallbacks, PlaybackOptions, PlaybackService } from './playback-service';

interface ScheduledNote {
  midi: number;
  /** 0-based units from fragment start. */
  startUnit0: number;
  spanUnits: number;
  /** 0–1; per-voice balance (see VOICE_VELOCITY). */
  velocity: number;
}

interface TimedNote {
  midi: number;
  startSec: number;
  durationSec: number;
  velocity: number;
}

/** One playable sound. Scheduling is relative to the engine's own clock. */
interface ActiveInstrument {
  /** Resume the underlying AudioContext (must run inside a user gesture). */
  resume(): Promise<void>;
  scheduleNotes(notes: TimedNote[]): void;
  stopAll(): void;
}

const DEFAULT_TEMPO_BPM = 76;
const SCHEDULE_DELAY_SECONDS = 0.08;

/**
 * Per-voice balance: inner voices tucked (they cause most mid-band
 * roughness), bass forward (the ear is less sensitive down there), melody
 * slightly forward. Tone velocity is 0–1; smplr maps to 0–127.
 */
const VOICE_VELOCITY: Record<VoiceId, number> = {
  soprano: 0.8,
  alto: 0.65,
  tenor: 0.65,
  bass: 0.9,
};

function toNote(
  event: {
    pitch: { midi: number };
    start: VoiceEvent['start'];
    duration: VoiceEvent['duration'];
  },
  velocity: number,
): ScheduledNote {
  const span = toTimelineSpan(event.start, event.duration);
  return {
    midi: event.pitch.midi,
    startUnit0: span.startUnit - 1,
    spanUnits: span.spanUnits,
    velocity,
  };
}

function startUnits(
  events: Array<{ start: VoiceEvent['start']; duration: VoiceEvent['duration'] }>,
): number[] {
  return events.map((event) => toTimelineSpan(event.start, event.duration).startUnit);
}

/* ---------- Tone.js synth engine ---------- */

type TonePolySynth = ToneTypes.PolySynth<ToneTypes.Synth> | ToneTypes.PolySynth<ToneTypes.FMSynth>;

class ToneSynthInstrument implements ActiveInstrument {
  constructor(
    private readonly tone: typeof ToneTypes,
    private readonly synth: TonePolySynth,
    private readonly noteLength: number,
  ) {}

  async resume(): Promise<void> {
    await this.tone.start();
  }

  scheduleNotes(notes: TimedNote[]): void {
    const now = this.tone.now() + SCHEDULE_DELAY_SECONDS;
    for (const note of notes) {
      this.synth.triggerAttackRelease(
        this.tone.Frequency(note.midi, 'midi').toFrequency(),
        note.durationSec * this.noteLength,
        now + note.startSec,
        note.velocity,
      );
    }
  }

  stopAll(): void {
    this.synth.releaseAll();
  }
}

/* ---------- smplr sampled engine ---------- */

/** Minimal structural type for smplr players (SplendidGrandPiano / Soundfont). */
interface SmplrPlayer {
  start(note: { note: number; time?: number; duration?: number; velocity?: number }): unknown;
  stop(): unknown;
}

class SmplrInstrument implements ActiveInstrument {
  constructor(
    private readonly context: AudioContext,
    private readonly player: SmplrPlayer,
    private readonly noteLength: number,
  ) {}

  async resume(): Promise<void> {
    if (this.context.state !== 'running') {
      await this.context.resume();
    }
  }

  scheduleNotes(notes: TimedNote[]): void {
    const now = this.context.currentTime + SCHEDULE_DELAY_SECONDS;
    for (const note of notes) {
      this.player.start({
        note: note.midi,
        time: now + note.startSec,
        duration: note.durationSec * this.noteLength,
        velocity: Math.round(note.velocity * 127),
      });
    }
  }

  stopAll(): void {
    this.player.stop();
  }
}

/* ---------- service ---------- */

export class ToneJsPlaybackService implements PlaybackService {
  private readonly callbacks: PlaybackCallbacks;
  private tonePromise: Promise<typeof ToneTypes> | null = null;
  private toneOutput: ToneTypes.Volume | null = null;
  private smplrContext: AudioContext | null = null;
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

  private async ensureTone(): Promise<typeof ToneTypes> {
    this.tonePromise ??= import('tone');
    return this.tonePromise;
  }

  private buildSynth(tone: typeof ToneTypes, config: ToneInstrumentConfig): TonePolySynth {
    if (config.kind === 'fm' && config.fm) {
      return new tone.PolySynth(tone.FMSynth, {
        harmonicity: config.fm.harmonicity,
        modulationIndex: config.fm.modulationIndex,
        oscillator: { type: 'sine' as const },
        envelope: config.envelope,
        modulation: { type: 'sine' as const },
        modulationEnvelope: config.fm.modulationEnvelope,
      });
    }
    return new tone.PolySynth(tone.Synth, {
      oscillator: config.partials
        ? { type: 'custom' as const, partials: config.partials }
        : { type: config.oscillatorType as 'sine' },
      envelope: config.envelope,
    });
  }

  private async buildToneInstrument(def: InstrumentDef): Promise<ActiveInstrument> {
    const tone = await this.ensureTone();
    if (!this.toneOutput) {
      const limiter = new tone.Limiter(-1).toDestination();
      this.toneOutput = new tone.Volume(0).connect(limiter);
    }
    const config = def.tone;
    if (!config) throw new Error(`Instrument ${def.id} has no tone config`);
    const synth = this.buildSynth(tone, config);
    const noteLength = noteLengthFor(def);
    const volume = new tone.Volume(config.volumeDb);
    if (config.lowpassHz) {
      const lowpass = new tone.Filter({
        frequency: config.lowpassHz,
        type: 'lowpass',
        rolloff: -12,
        Q: 0.5,
      }).connect(this.toneOutput);
      volume.connect(lowpass);
    } else {
      volume.connect(this.toneOutput);
    }
    synth.connect(volume);
    return new ToneSynthInstrument(tone, synth, noteLength);
  }

  private async buildSmplrInstrument(def: InstrumentDef): Promise<ActiveInstrument> {
    const config = def.smplr;
    if (!config) throw new Error(`Instrument ${def.id} has no smplr config`);
    const smplr = await import('smplr');
    this.smplrContext ??= new AudioContext();
    const context = this.smplrContext;
    const noteLength = noteLengthFor(def);
    // Cache samples in the browser Cache API (secure contexts only) so a
    // ~3MB soundfont isn't re-fetched on every visit.
    const storage = typeof caches !== 'undefined' ? smplr.CacheStorage() : undefined;
    if (config.kind === 'piano') {
      const piano = smplr.SplendidGrandPiano(context, {
        volume: config.volume ?? 100,
        ...(storage ? { storage } : {}),
      });
      await piano.ready;
      return new SmplrInstrument(context, piano, noteLength);
    }
    const soundfont = smplr.Soundfont(context, {
      instrument: config.soundfontInstrument ?? 'church_organ',
      volume: config.volume ?? 100,
      ...(storage ? { storage } : {}),
    });
    await soundfont.ready;
    return new SmplrInstrument(context, soundfont, noteLength);
  }

  /** Load (or reuse) the selected instrument; fall back to the offline synth. */
  private async ensureInstrument(): Promise<ActiveInstrument> {
    const def = getInstrumentDef(this.desiredInstrumentId);
    const cached = this.instruments.get(def.id);
    if (cached) return cached;
    try {
      const instrument =
        def.engine === 'tone'
          ? await this.buildToneInstrument(def)
          : await this.buildSmplrInstrument(def);
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
