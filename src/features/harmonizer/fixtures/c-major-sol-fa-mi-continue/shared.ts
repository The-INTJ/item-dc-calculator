/**
 * Fixture A — shared context (spec §11.1): C major, previous harmony I in
 * root position, phrase intent Continue, melody sol–fa–mi.
 *
 * The match block values must equal the signatures computed from this very
 * data by domain/signatures.ts — enforced by fixtures/registry.test.ts.
 */

import type { CandidateProvenance } from '../../domain/analysis-types';
import type { FixtureInitialState, FixtureMatchCriteria } from '../../domain/fixture-types';
import type {
  BoundaryConstraint,
  ChordStructure,
  HarmonyEvent,
  MelodyFragment,
  TonalContext,
  VoiceEvent,
} from '../../domain/music-types';
import type { AcceptedContext } from '../../domain/workbench-state';
import { at, deg, H, pc, pitch, Q, W } from '../authoring';

export const FIXTURE_ID = 'c-major-sol-fa-mi-continue';

export const cMajorTriad: ChordStructure = {
  id: 'chord-c-major',
  root: pc('C'),
  pitchClasses: [0, 4, 7],
  spelledChordTones: [pc('C'), pc('E'), pc('G')],
  quality: 'major',
};

export const g7Chord: ChordStructure = {
  id: 'chord-g-dominant-seventh',
  root: pc('G'),
  pitchClasses: [7, 11, 2, 5],
  spelledChordTones: [pc('G'), pc('B'), pc('D'), pc('F')],
  quality: 'dominant_seventh',
};

export const tonalContext: TonalContext = {
  tonic: pc('C'),
  tonicPitchClass: 0,
  mode: 'major',
  keySignature: 'C',
  solfegeSystem: 'movable_do',
};

export const melodyFragment: MelodyFragment = {
  id: 'fragment-sol-fa-mi',
  events: [
    {
      id: 'mel-sol',
      pitch: pitch('G4'),
      scaleDegree: deg(5, 'sol'),
      start: at(1, 1),
      duration: Q,
      tieFromPrevious: false,
      metricStrength: 'strong',
    },
    {
      id: 'mel-fa',
      pitch: pitch('F4'),
      scaleDegree: deg(4, 'fa'),
      start: at(1, 2),
      duration: Q,
      tieFromPrevious: false,
      metricStrength: 'weak',
    },
    {
      id: 'mel-mi',
      pitch: pitch('E4'),
      scaleDegree: deg(3, 'mi'),
      start: at(1, 3),
      duration: H,
      tieFromPrevious: false,
      metricStrength: 'medium',
    },
  ],
};

// Boundary metadata predates Drew's redesign (boundaries now merely reflect
// the selected reading). 'allowed' throughout so lock-alternative sets may
// re-harmonize any beat; the hold/required machinery stays for future use.
export const boundaryConstraints: BoundaryConstraint[] = [
  { afterMelodyEventId: 'mel-sol', policy: 'allowed' },
  { afterMelodyEventId: 'mel-fa', policy: 'allowed' },
];

export const previousHarmony: HarmonyEvent = {
  id: 'ctx-tonic',
  start: at(0, 1),
  duration: W,
  chord: cMajorTriad,
  analysis: {
    romanNumeral: 'I',
    scaleDegreeRoot: deg(1, 'do'),
    functionTags: ['tonic'],
  },
  inversion: 0,
  bassPitch: pitch('C3'),
  displaySymbol: 'C',
};

export const acceptedContext: AcceptedContext = {
  previousHarmony,
  previousVoicing: null,
};

export const initialState: FixtureInitialState = {
  tonalContext,
  phraseIntent: 'continue',
  tempoBpm: 76,
  acceptedContext,
  fragment: melodyFragment,
  boundaryConstraints,
};

export const match: FixtureMatchCriteria = {
  tonalContext: { tonicPitchClass: 0, mode: 'major' },
  melodySignature: 'sol4:q|fa4:q|mi4:h',
  phraseIntent: 'continue',
  acceptedHarmonySignature: 'I:root',
};

export const fixtureProvenance: CandidateProvenance = {
  generatorId: 'fixture',
  generatorVersion: '0.1.0',
  knowledgePackIds: ['poc-hymn-major-v1'],
  fixtureAuthored: true,
};

/** Every candidate's soprano mirrors the melody exactly (the melody IS the soprano). */
export function sopranoFromMelody(idPrefix: string): VoiceEvent[] {
  return melodyFragment.events.map((event, index) => ({
    id: `${idPrefix}-s-${index + 1}`,
    voice: 'soprano' as const,
    pitch: event.pitch,
    scaleDegree: event.scaleDegree,
    start: event.start,
    duration: event.duration,
    tieFromPrevious: event.tieFromPrevious,
  }));
}
