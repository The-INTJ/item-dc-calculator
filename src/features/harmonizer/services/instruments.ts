/**
 * The instrument roster behind the Sound toggle. Two engines:
 * - 'tone': synthesized patches (instant, offline, pitch-clear)
 * - 'smplr': sampled instruments (realistic; samples fetched over the network
 *   on first use, with graceful fallback to the default synth when offline)
 *
 * Patch/config values are data here; the playback service owns construction.
 */

export type InstrumentEngine = 'tone' | 'smplr';

export type InstrumentId =
  | 'soft-organ'
  | 'warm-reed'
  | 'warm-synth'
  | 'piano'
  | 'church-organ'
  | 'choir'
  | 'strings';

interface EnvelopeConfig {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

export interface ToneInstrumentConfig {
  kind: 'basic' | 'fm';
  oscillatorType: string;
  /**
   * Overtone weights for a 'custom' oscillator (index 0 = fundamental).
   * When present, oscillatorType is ignored.
   */
  partials?: number[];
  envelope: EnvelopeConfig;
  /** Master volume in dB for this patch (pre-limiter). */
  volumeDb: number;
  /** Gentle lowpass between the patch and the bus, when a lid is needed. */
  lowpassHz?: number;
  /** FM parameters, present when kind === 'fm'. */
  fm?: {
    harmonicity: number;
    modulationIndex: number;
    modulationEnvelope: EnvelopeConfig;
  };
}

export interface SmplrInstrumentConfig {
  kind: 'piano' | 'soundfont';
  /** General-MIDI instrument name for kind 'soundfont'. */
  soundfontInstrument?: string;
  volume?: number; // 0–127 smplr volume
}

export interface InstrumentDef {
  id: InstrumentId;
  label: string;
  engine: InstrumentEngine;
  /** Present when engine === 'tone'. */
  tone?: ToneInstrumentConfig;
  /** Present when engine === 'smplr'. */
  smplr?: SmplrInstrumentConfig;
  /** Needs a network fetch on first use. */
  requiresNetwork: boolean;
}

/**
 * Organ "principal" voicing: sine fundamental + octave + double-octave ONLY.
 * Every partial shares the played note's pitch class, so low bass can never
 * imply a second pitch (a triangle's 3rd harmonic is a twelfth — a different
 * pitch class — which is exactly the "more than one note" artifact). The
 * octave partials keep the bass audible on small speakers where the
 * fundamental itself rolls off. Default sound.
 */
const SOFT_ORGAN: ToneInstrumentConfig = {
  kind: 'basic',
  oscillatorType: 'custom',
  partials: [1, 0.22, 0, 0.06],
  envelope: { attack: 0.02, decay: 0.06, sustain: 0.9, release: 0.12 },
  volumeDb: -10,
};

/**
 * FM reed: modulator at the carrier pitch (harmonicity 1) puts every sideband
 * exactly on an integer harmonic — warm, never clangorous, clean in the bass.
 * Brightness blooms on the onset then settles dark.
 */
const WARM_REED: ToneInstrumentConfig = {
  kind: 'fm',
  oscillatorType: 'sine',
  envelope: { attack: 0.025, decay: 0.15, sustain: 0.75, release: 0.14 },
  volumeDb: -10,
  lowpassHz: 3200,
  fm: {
    harmonicity: 1,
    modulationIndex: 5,
    modulationEnvelope: { attack: 0.05, decay: 0.25, sustain: 0.35, release: 0.1 },
  },
};

/** The original triangle patch, kept for A/B comparison. */
const WARM_SYNTH: ToneInstrumentConfig = {
  kind: 'basic',
  oscillatorType: 'triangle',
  envelope: { attack: 0.03, decay: 0.12, sustain: 0.65, release: 0.3 },
  volumeDb: -10,
};

/**
 * Soundfont volumes sit below the piano's because smplr applies an extra
 * gain stage (default 5×) to soundfont instruments only.
 */
const SOUNDFONT_VOLUME = 85;

export const INSTRUMENTS: InstrumentDef[] = [
  {
    id: 'soft-organ',
    label: 'Soft organ (synth)',
    engine: 'tone',
    tone: SOFT_ORGAN,
    requiresNetwork: false,
  },
  {
    id: 'warm-reed',
    label: 'Warm reed (synth)',
    engine: 'tone',
    tone: WARM_REED,
    requiresNetwork: false,
  },
  {
    id: 'warm-synth',
    label: 'Warm synth (original)',
    engine: 'tone',
    tone: WARM_SYNTH,
    requiresNetwork: false,
  },
  {
    id: 'piano',
    label: 'Piano (sampled)',
    engine: 'smplr',
    smplr: { kind: 'piano' },
    requiresNetwork: true,
  },
  {
    id: 'church-organ',
    label: 'Church organ (sampled)',
    engine: 'smplr',
    smplr: {
      kind: 'soundfont',
      soundfontInstrument: 'church_organ',
      volume: SOUNDFONT_VOLUME,
    },
    requiresNetwork: true,
  },
  {
    id: 'choir',
    label: 'Choir (sampled)',
    engine: 'smplr',
    smplr: {
      kind: 'soundfont',
      soundfontInstrument: 'choir_aahs',
      volume: SOUNDFONT_VOLUME,
    },
    requiresNetwork: true,
  },
  {
    id: 'strings',
    label: 'Strings (sampled)',
    engine: 'smplr',
    smplr: {
      kind: 'soundfont',
      soundfontInstrument: 'string_ensemble_1',
      volume: SOUNDFONT_VOLUME,
    },
    requiresNetwork: true,
  },
];

export const DEFAULT_INSTRUMENT_ID: InstrumentId = 'soft-organ';

export function getInstrumentDef(id: InstrumentId): InstrumentDef {
  return INSTRUMENTS.find((def) => def.id === id) ?? INSTRUMENTS[0];
}
