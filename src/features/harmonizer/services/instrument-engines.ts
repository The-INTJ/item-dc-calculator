/**
 * The two ActiveInstrument engine adapters behind the Sound toggle:
 * Tone.js PolySynth patches and smplr sampled players. Both schedule against
 * their engine's own clock; the service owns loading, routing, and timing.
 */

import type * as ToneTypes from 'tone';

export interface TimedNote {
  midi: number;
  startSec: number;
  durationSec: number;
  velocity: number;
}

/** One playable sound. Scheduling is relative to the engine's own clock. */
export interface ActiveInstrument {
  /** Resume the underlying AudioContext (must run inside a user gesture). */
  resume(): Promise<void>;
  scheduleNotes(notes: TimedNote[]): void;
  stopAll(): void;
}

export const SCHEDULE_DELAY_SECONDS = 0.08;

/* ---------- Tone.js synth engine ---------- */

export type TonePolySynth =
  | ToneTypes.PolySynth<ToneTypes.Synth>
  | ToneTypes.PolySynth<ToneTypes.FMSynth>;

export class ToneSynthInstrument implements ActiveInstrument {
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
export interface SmplrPlayer {
  start(note: { note: number; time?: number; duration?: number; velocity?: number }): unknown;
  stop(): unknown;
}

export class SmplrInstrument implements ActiveInstrument {
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
