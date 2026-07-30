/**
 * Fixture E — the minor-key mock (la-based movable-do). A minor reads
 * la–ti–do…; the raised leading tone is authored per-note as si
 * (deg(7,'si',+1) → G#). The "Deceptive turn" candidate shows si live in the
 * tenor.
 */

import type { CandidatePath, MelodyInterpretation } from '../../domain/analysis-types';
import type { HarmonizationFixture } from '../../domain/fixture-types';
import type {
  ChordStructure,
  HarmonyEvent,
  MusicalTime,
  RationalDuration,
  ScaleDegreePitch,
  SolfegeSyllable,
  VoiceEvent,
  VoiceId,
} from '../../domain/music-types';
import { at, deg, H, pc, pitch, Q, W } from '../authoring';

const aMinor: ChordStructure = {
  id: 'chord-a-minor',
  root: pc('A'),
  pitchClasses: [9, 0, 4],
  spelledChordTones: [pc('A'), pc('C'), pc('E')],
  quality: 'minor',
};
const cMajor: ChordStructure = {
  id: 'chord-c-major',
  root: pc('C'),
  pitchClasses: [0, 4, 7],
  spelledChordTones: [pc('C'), pc('E'), pc('G')],
  quality: 'major',
};
const eMajor: ChordStructure = {
  id: 'chord-e-major',
  root: pc('E'),
  pitchClasses: [4, 8, 11],
  spelledChordTones: [pc('E'), pc('G#'), pc('B')],
  quality: 'major',
};
const fMajor: ChordStructure = {
  id: 'chord-f-major',
  root: pc('F'),
  pitchClasses: [5, 9, 0],
  spelledChordTones: [pc('F'), pc('A'), pc('C')],
  quality: 'major',
};

const tonalContext = {
  tonic: pc('A'),
  tonicPitchClass: 9,
  mode: 'natural_minor' as const,
  minorDoSystem: 'la_based' as const,
  solfegeSystem: 'movable_do' as const,
};

const melodyFragment = {
  id: 'fragment-la-ti-do',
  events: [
    {
      id: 'e-mel-la',
      pitch: pitch('A4'),
      scaleDegree: deg(1, 'la'),
      start: at(1, 1),
      duration: Q,
      tieFromPrevious: false,
      metricStrength: 'strong' as const,
    },
    {
      id: 'e-mel-ti',
      pitch: pitch('B4'),
      scaleDegree: deg(2, 'ti'),
      start: at(1, 2),
      duration: Q,
      tieFromPrevious: false,
      metricStrength: 'weak' as const,
    },
    {
      id: 'e-mel-do',
      pitch: pitch('C5'),
      scaleDegree: deg(3, 'do'),
      start: at(1, 3),
      duration: H,
      tieFromPrevious: false,
      metricStrength: 'medium' as const,
    },
  ],
};

const previousHarmony: HarmonyEvent = {
  id: 'e-ctx-tonic',
  start: at(0, 1),
  duration: { numerator: 1, denominator: 1 },
  chord: aMinor,
  analysis: { romanNumeral: 'i', scaleDegreeRoot: deg(1, 'la'), functionTags: ['tonic'] },
  inversion: 0,
  bassPitch: pitch('A2'),
  displaySymbol: 'Am',
};

function harmony(
  id: string,
  chord: ChordStructure,
  romanNumeral: string,
  rootDegree: ScaleDegreePitch,
  functionTags: HarmonyEvent['analysis']['functionTags'],
  start: MusicalTime,
  duration: RationalDuration,
  bass: string,
  displaySymbol: string,
): HarmonyEvent {
  return {
    id,
    start,
    duration,
    chord,
    analysis: { romanNumeral, scaleDegreeRoot: rootDegree, functionTags },
    inversion: 0,
    bassPitch: pitch(bass),
    displaySymbol,
  };
}

function voiceEvents(
  prefix: string,
  voice: VoiceId,
  rows: Array<
    [string, Parameters<typeof deg>[0], SolfegeSyllable, MusicalTime, RationalDuration, number?]
  >,
): VoiceEvent[] {
  return rows.map(([notation, degree, syllable, start, duration, chromaticOffset], index) => ({
    id: `${prefix}-${voice[0]}-${index + 1}`,
    voice,
    pitch: pitch(notation),
    scaleDegree: deg(degree, syllable, chromaticOffset ?? 0),
    start,
    duration,
    tieFromPrevious: false,
  }));
}

function soprano(prefix: string): VoiceEvent[] {
  return melodyFragment.events.map((event, index) => ({
    id: `${prefix}-s-${index + 1}`,
    voice: 'soprano' as const,
    pitch: event.pitch,
    scaleDegree: event.scaleDegree,
    start: event.start,
    duration: event.duration,
    tieFromPrevious: event.tieFromPrevious,
  }));
}

const provenance = {
  generatorId: 'fixture',
  generatorVersion: '0.1.0',
  knowledgePackIds: ['poc-hymn-minor-v1'],
  fixtureAuthored: true,
};

function interp(
  prefix: string,
  rows: Array<[string, string[], MelodyInterpretation['role'], string]>,
): MelodyInterpretation[] {
  return rows.map(([melodyEventId, harmonyEventIds, role, explanation], index) => ({
    melodyEventId,
    harmonyEventIds,
    role,
    explanation,
    evidence: [
      {
        id: `${prefix}-int-${index + 1}`,
        source: 'computed' as const,
        featureId: 'chord_membership',
        value: role === 'chord_tone',
        explanation,
        providerId: 'fixture',
        providerVersion: '0.1.0',
      },
    ],
  }));
}

const minorGrounding: CandidatePath = {
  id: 'minor-grounding',
  fixtureId: 'a-minor-la-ti-do-continue',
  title: 'Minor grounding',
  summary: 'Hold the minor tonic while ti passes upward to do.',
  tonalContext,
  phraseIntent: 'continue',
  harmonyEvents: [
    harmony('em1-h1', aMinor, 'i', deg(1, 'la'), ['tonic', 'tonic_prolongation'], at(1, 1), W, 'A2', 'Am'),
  ],
  voicing: {
    soprano: soprano('em1'),
    alto: voiceEvents('em1', 'alto', [['E4', 5, 'mi', at(1, 1), W]]),
    tenor: voiceEvents('em1', 'tenor', [['C4', 3, 'do', at(1, 1), W]]),
    bass: voiceEvents('em1', 'bass', [['A2', 1, 'la', at(1, 1), W]]),
  },
  melodyInterpretations: interp('em1', [
    ['e-mel-la', ['em1-h1'], 'chord_tone', 'La is the root of the minor tonic.'],
    ['e-mel-ti', ['em1-h1'], 'passing_tone', 'Ti passes between la and do over the held chord.'],
    ['e-mel-do', ['em1-h1'], 'chord_tone', 'Do is the minor third — home color.'],
  ]),
  descriptors: [
    {
      id: 'em1-desc',
      dimension: 'stability',
      label: 'settled minor',
      explanation: 'Nothing moves; the mode itself does the coloring.',
      evidenceIds: ['em1-ev-1'],
      source: 'curated',
    },
  ],
  evidence: [
    {
      id: 'em1-ev-1',
      source: 'computed',
      featureId: 'harmonic_rhythm',
      value: 'static',
      explanation: 'One chord across the fragment.',
      providerId: 'fixture',
      providerVersion: '0.1.0',
    },
  ],
  rank: 1,
  provenance,
};

const relativeLight: CandidatePath = {
  id: 'relative-light',
  fixtureId: 'a-minor-la-ti-do-continue',
  title: 'Relative light',
  summary: 'Let do arrive on its own relative-major chord.',
  tonalContext,
  phraseIntent: 'continue',
  harmonyEvents: [
    harmony('em2-h1', aMinor, 'i', deg(1, 'la'), ['tonic'], at(1, 1), H, 'A2', 'Am'),
    harmony('em2-h2', cMajor, 'III', deg(3, 'do'), ['tonic_prolongation'], at(1, 3), H, 'C3', 'C'),
  ],
  voicing: {
    soprano: soprano('em2'),
    alto: voiceEvents('em2', 'alto', [
      ['E4', 5, 'mi', at(1, 1), H],
      ['E4', 5, 'mi', at(1, 3), H],
    ]),
    tenor: voiceEvents('em2', 'tenor', [
      ['C4', 3, 'do', at(1, 1), H],
      ['G3', 7, 'sol', at(1, 3), H],
    ]),
    bass: voiceEvents('em2', 'bass', [
      ['A2', 1, 'la', at(1, 1), H],
      ['C3', 3, 'do', at(1, 3), H],
    ]),
  },
  melodyInterpretations: interp('em2', [
    ['e-mel-la', ['em2-h1'], 'chord_tone', 'La is the root of i.'],
    ['e-mel-ti', ['em2-h1'], 'passing_tone', 'Ti passes over the tonic toward the relative major.'],
    ['e-mel-do', ['em2-h2'], 'chord_tone', 'Do is the root of III — the light inside the minor.'],
  ]),
  descriptors: [
    {
      id: 'em2-desc',
      dimension: 'brightness',
      label: 'relative light',
      explanation: 'The phrase brightens without leaving home.',
      evidenceIds: ['em2-ev-1'],
      source: 'curated',
    },
  ],
  evidence: [
    {
      id: 'em2-ev-1',
      source: 'computed',
      featureId: 'common_tones',
      value: 2,
      explanation: 'i and III share two tones — a gentle shift.',
      providerId: 'fixture',
      providerVersion: '0.1.0',
    },
  ],
  rank: 2,
  provenance,
};

const deceptiveTurn: CandidatePath = {
  id: 'deceptive-turn',
  fixtureId: 'a-minor-la-ti-do-continue',
  title: 'Deceptive turn',
  summary: 'A raised-si dominant that resolves sideways into VI.',
  tonalContext,
  phraseIntent: 'continue',
  harmonyEvents: [
    harmony('em3-h1', aMinor, 'i', deg(1, 'la'), ['tonic'], at(1, 1), Q, 'A2', 'Am'),
    harmony('em3-h2', eMajor, 'V', deg(5, 'mi'), ['dominant'], at(1, 2), Q, 'E3', 'E'),
    harmony('em3-h3', fMajor, 'VI', deg(6, 'fa'), ['tonic_prolongation'], at(1, 3), H, 'F3', 'F'),
  ],
  voicing: {
    soprano: soprano('em3'),
    alto: voiceEvents('em3', 'alto', [
      ['E4', 5, 'mi', at(1, 1), Q],
      ['E4', 5, 'mi', at(1, 2), Q],
      ['C4', 3, 'do', at(1, 3), H],
    ]),
    tenor: voiceEvents('em3', 'tenor', [
      ['C4', 3, 'do', at(1, 1), Q],
      ['G#3', 7, 'si', at(1, 2), Q, 1],
      ['A3', 1, 'la', at(1, 3), H],
    ]),
    bass: voiceEvents('em3', 'bass', [
      ['A2', 1, 'la', at(1, 1), Q],
      ['E3', 5, 'mi', at(1, 2), Q],
      ['F3', 6, 'fa', at(1, 3), H],
    ]),
  },
  melodyInterpretations: interp('em3', [
    ['e-mel-la', ['em3-h1'], 'chord_tone', 'La is the root of i.'],
    ['e-mel-ti', ['em3-h2'], 'chord_tone', 'Ti is the fifth of the raised dominant.'],
    ['e-mel-do', ['em3-h3'], 'chord_tone', 'Do is the fifth of VI — the deceptive landing.'],
  ]),
  descriptors: [
    {
      id: 'em3-desc',
      dimension: 'forward_motion',
      label: 'deceptive turn',
      explanation: 'The tenor’s si (G♯) promises home, and VI takes it somewhere else.',
      evidenceIds: ['em3-ev-1'],
      source: 'curated',
    },
  ],
  evidence: [
    {
      id: 'em3-ev-1',
      source: 'rule',
      featureId: 'raised_leading_tone',
      value: true,
      explanation: 'Minor V conventionally raises degree 7: sol becomes si.',
      providerId: 'poc-hymn-minor-v1',
      providerVersion: '0.1.0',
    },
  ],
  rank: 3,
  provenance,
};

export const aMinorLaTiDoContinue = {
  id: 'a-minor-la-ti-do-continue',
  name: 'Rising minor — la, ti, do',
  match: {
    tonalContext: { tonicPitchClass: 9, mode: 'natural_minor' },
    melodySignature: 'la4:q|ti4:q|do5:h',
    phraseIntent: 'continue',
  },
  initialState: {
    tonalContext,
    phraseIntent: 'continue',
    tempoBpm: 69,
    acceptedContext: { previousHarmony, previousVoicing: null },
    fragment: melodyFragment,
    boundaryConstraints: [
      { afterMelodyEventId: 'e-mel-la', policy: 'allowed' },
      { afterMelodyEventId: 'e-mel-ti', policy: 'allowed' },
    ],
  },
  candidateSets: [
    {
      id: 'default',
      candidates: [minorGrounding, relativeLight, deceptiveTurn],
    },
  ],
} satisfies HarmonizationFixture;
