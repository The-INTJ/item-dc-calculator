/**
 * Instrument construction for playback: builds 'tone' engine synth patches
 * (with the shared Volume→Limiter(-1) output chain) and 'smplr' sampled
 * instruments (piano / GM soundfonts), caching the Tone.js module and the
 * AudioContext across builds. Everything loads via dynamic import on first
 * play — never during SSR or in jsdom tests.
 */

import type * as ToneTypes from 'tone';
import {
  SmplrInstrument,
  ToneSynthInstrument,
  type ActiveInstrument,
  type TonePolySynth,
} from './instrument-engines';
import {
  noteLengthFor,
  type InstrumentDef,
  type ToneInstrumentConfig,
} from './instruments';

export class InstrumentLoader {
  private tonePromise: Promise<typeof ToneTypes> | null = null;
  private toneOutput: ToneTypes.Volume | null = null;
  private smplrContext: AudioContext | null = null;

  /** Build the instrument for a definition on its declared engine. */
  async build(def: InstrumentDef): Promise<ActiveInstrument> {
    return def.engine === 'tone'
      ? this.buildToneInstrument(def)
      : this.buildSmplrInstrument(def);
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
}
