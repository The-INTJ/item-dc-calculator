/**
 * Core musical domain types for the Hymn Harmonization Workbench.
 *
 * Mirrors spec §15.1–15.9 (hymn_harmonization_workbench_spec.md). The
 * distinctions preserved here are normative: spelling is never collapsed to
 * MIDI or pitch class, chord identity is separate from key-relative analysis,
 * and time is rational musical time, not seconds.
 */

export type LetterName = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';

export type Accidental = 'bb' | 'b' | 'natural' | '#' | 'x';

export interface SpelledPitch {
  letter: LetterName;
  accidental: Accidental;
  octave: number;
  midi: number;
  pitchClass: number; // 0–11
}

/** A spelled pitch without register — chord roots, chord tones, tonics. */
export type SpelledPitchClass = Omit<SpelledPitch, 'octave' | 'midi'>;

export type DiatonicDegree = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type SolfegeSyllable =
  | 'do'
  | 'di'
  | 'ra'
  | 're'
  | 'ri'
  | 'me'
  | 'mi'
  | 'fa'
  | 'fi'
  | 'se'
  | 'sol'
  | 'si'
  | 'le'
  | 'la'
  | 'li'
  | 'te'
  | 'ti';

export interface ScaleDegreePitch {
  degree: DiatonicDegree;
  chromaticOffset: number;
  syllable: SolfegeSyllable;
}

export type ModeId =
  | 'major'
  | 'natural_minor'
  | 'harmonic_minor'
  | 'melodic_minor'
  | 'dorian'
  | 'mixolydian';

export interface TonalContext {
  tonic: SpelledPitchClass;
  tonicPitchClass: number;
  mode: ModeId;
  solfegeSystem: 'movable_do';
  minorDoSystem?: 'do_based' | 'la_based';
}

export interface MusicalTime {
  measure: number;
  /** 1-based beat within the measure. */
  beat: number;
  /** Sixteenth units within the beat (0–3 in 4/4). See domain/timing.ts. */
  subdivision: number;
}

export interface RationalDuration {
  numerator: number;
  denominator: number;
}

export interface MelodyEvent {
  id: string;
  pitch: SpelledPitch;
  scaleDegree: ScaleDegreePitch;
  start: MusicalTime;
  duration: RationalDuration;
  tieFromPrevious: boolean;
  metricStrength?: 'strong' | 'medium' | 'weak';
  phraseBoundaryAfter?: 'none' | 'subphrase' | 'phrase' | 'stanza';
}

export interface MelodyFragment {
  id: string;
  events: MelodyEvent[];
}

export type HarmonicBoundaryPolicy = 'hold' | 'allowed' | 'required';

export interface BoundaryConstraint {
  afterMelodyEventId: string;
  policy: HarmonicBoundaryPolicy;
}

export type ChordQuality =
  | 'major'
  | 'minor'
  | 'diminished'
  | 'augmented'
  | 'dominant_seventh'
  | 'major_seventh'
  | 'minor_seventh'
  | 'half_diminished_seventh'
  | 'fully_diminished_seventh'
  | 'suspended_second'
  | 'suspended_fourth'
  | 'other';

/** A chord's identity, independent of any key or function. */
export interface ChordStructure {
  id: string;
  root: SpelledPitchClass;
  pitchClasses: number[];
  spelledChordTones: SpelledPitchClass[];
  quality: ChordQuality;
  extensions?: string[];
  alterations?: string[];
}

export type HarmonicFunctionTag =
  | 'tonic'
  | 'tonic_prolongation'
  | 'predominant'
  | 'dominant'
  | 'dominant_prolongation'
  | 'passing'
  | 'pedal'
  | 'ambiguous';

/** The key-relative reading of a chord — kept apart from ChordStructure. */
export interface HarmonicAnalysis {
  romanNumeral: string;
  scaleDegreeRoot: ScaleDegreePitch;
  functionTags: HarmonicFunctionTag[];
  appliedTo?: string;
  borrowedFrom?: ModeId;
}

export interface HarmonyEvent {
  id: string;
  start: MusicalTime;
  duration: RationalDuration;
  chord: ChordStructure;
  analysis: HarmonicAnalysis;
  inversion: 0 | 1 | 2 | 3;
  bassPitch: SpelledPitch;
  figuredBass?: string;
  /** e.g. "C", "G7", "C/E" */
  displaySymbol: string;
}

export type VoiceId = 'soprano' | 'alto' | 'tenor' | 'bass';

export interface VoiceEvent {
  id: string;
  voice: VoiceId;
  pitch: SpelledPitch;
  scaleDegree: ScaleDegreePitch;
  start: MusicalTime;
  duration: RationalDuration;
  tieFromPrevious: boolean;
}

export interface SATBVoicing {
  soprano: VoiceEvent[];
  alto: VoiceEvent[];
  tenor: VoiceEvent[];
  bass: VoiceEvent[];
}

export type PhraseIntent = 'continue' | 'build' | 'approach_cadence' | 'close';
