/**
 * Fixture C — re approaching mi (spec §11.3): tonic function without
 * root-position closure. I6 keeps the phrase open.
 */

import type { CandidatePath, MelodyInterpretation } from '../../domain/analysis-types';
import type { HarmonizationFixture } from '../../domain/fixture-types';
import type {
  ChordStructure,
  HarmonyEvent,
  MusicalTime,
  RationalDuration,
  ScaleDegreePitch,
  VoiceEvent,
  VoiceId,
} from '../../domain/music-types';
import { at, deg, pc, pitch, Q } from '../authoring';

const DOTTED_HALF: RationalDuration = { numerator: 3, denominator: 4 };

const cMajor: ChordStructure = {
  id: 'chord-c-major',
  root: pc('C'),
  pitchClasses: [0, 4, 7],
  spelledChordTones: [pc('C'), pc('E'), pc('G')],
  quality: 'major',
};
const gMajor: ChordStructure = {
  id: 'chord-g-major',
  root: pc('G'),
  pitchClasses: [7, 11, 2],
  spelledChordTones: [pc('G'), pc('B'), pc('D')],
  quality: 'major',
};
const dMinor: ChordStructure = {
  id: 'chord-d-minor',
  root: pc('D'),
  pitchClasses: [2, 5, 9],
  spelledChordTones: [pc('D'), pc('F'), pc('A')],
  quality: 'minor',
};

const tonalContext = {
  tonic: pc('C'),
  tonicPitchClass: 0,
  mode: 'major' as const,
  solfegeSystem: 'movable_do' as const,
};

const melodyFragment = {
  id: 'fragment-re-mi',
  events: [
    {
      id: 'c6-mel-re',
      pitch: pitch('D4'),
      scaleDegree: deg(2, 're'),
      start: at(1, 1),
      duration: Q,
      tieFromPrevious: false,
      metricStrength: 'strong' as const,
    },
    {
      id: 'c6-mel-mi',
      pitch: pitch('E4'),
      scaleDegree: deg(3, 'mi'),
      start: at(1, 2),
      duration: DOTTED_HALF,
      tieFromPrevious: false,
      metricStrength: 'medium' as const,
    },
  ],
};

const previousHarmony: HarmonyEvent = {
  id: 'c6-ctx-tonic',
  start: at(0, 1),
  duration: { numerator: 1, denominator: 1 },
  chord: cMajor,
  analysis: { romanNumeral: 'I', scaleDegreeRoot: deg(1, 'do'), functionTags: ['tonic'] },
  inversion: 0,
  bassPitch: pitch('C3'),
  displaySymbol: 'C',
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
  inversion: 0 | 1 = 0,
): HarmonyEvent {
  return {
    id,
    start,
    duration,
    chord,
    analysis: { romanNumeral, scaleDegreeRoot: rootDegree, functionTags },
    inversion,
    bassPitch: pitch(bass),
    displaySymbol,
    ...(inversion === 1 ? { figuredBass: '6' } : {}),
  };
}

function voiceEvents(
  prefix: string,
  voice: VoiceId,
  rows: Array<[string, Parameters<typeof deg>[0], Parameters<typeof deg>[1], MusicalTime, RationalDuration]>,
): VoiceEvent[] {
  return rows.map(([notation, degree, syllable, start, duration], index) => ({
    id: `${prefix}-${voice[0]}-${index + 1}`,
    voice,
    pitch: pitch(notation),
    scaleDegree: deg(degree, syllable),
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
  knowledgePackIds: ['poc-hymn-major-v1'],
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

function makeCandidate(
  prefix: string,
  id: string,
  title: string,
  summary: string,
  harmonyEvents: HarmonyEvent[],
  alto: VoiceEvent[],
  tenor: VoiceEvent[],
  bass: VoiceEvent[],
  interps: MelodyInterpretation[],
  descriptorLabel: string,
  descriptorExplanation: string,
  rank: number,
): CandidatePath {
  return {
    id,
    fixtureId: 'c-major-re-mi-continue-i6',
    title,
    summary,
    tonalContext,
    phraseIntent: 'continue',
    harmonyEvents,
    voicing: { soprano: soprano(prefix), alto, tenor, bass },
    melodyInterpretations: interps,
    descriptors: [
      {
        id: `${prefix}-desc`,
        dimension: 'closure_strength',
        label: descriptorLabel,
        explanation: descriptorExplanation,
        evidenceIds: [`${prefix}-ev-1`],
        source: 'curated',
      },
    ],
    evidence: [
      {
        id: `${prefix}-ev-1`,
        source: 'computed',
        featureId: 'final_inversion',
        value: harmonyEvents[harmonyEvents.length - 1].inversion === 1 ? 'first' : 'root',
        explanation: 'The closing inversion decides how settled mi feels.',
        providerId: 'fixture',
        providerVersion: '0.1.0',
      },
    ],
    rank,
    provenance,
  };
}

const tonicWithoutClosing = makeCandidate(
  'ci1',
  'tonic-without-closing',
  'Tonic without closing',
  'Arrive on tonic in first inversion — mi lands, but the phrase stays open.',
  [
    harmony('ci1-h1', gMajor, 'V', deg(5, 'sol'), ['dominant'], at(1, 1), Q, 'G2', 'G'),
    harmony('ci1-h2', cMajor, 'I6', deg(1, 'do'), ['tonic'], at(1, 2), DOTTED_HALF, 'E3', 'C/E', 1),
  ],
  voiceEvents('ci1', 'alto', [
    ['B3', 7, 'ti', at(1, 1), Q],
    ['C4', 1, 'do', at(1, 2), DOTTED_HALF],
  ]),
  voiceEvents('ci1', 'tenor', [
    ['G3', 5, 'sol', at(1, 1), Q],
    ['G3', 5, 'sol', at(1, 2), DOTTED_HALF],
  ]),
  voiceEvents('ci1', 'bass', [
    ['G2', 5, 'sol', at(1, 1), Q],
    ['E3', 3, 'mi', at(1, 2), DOTTED_HALF],
  ]),
  interp('ci1', [
    ['c6-mel-re', ['ci1-h1'], 'chord_tone', 'Re is the fifth of V.'],
    ['c6-mel-mi', ['ci1-h2'], 'chord_tone', 'Mi is the third of tonic, doubled by the bass — open, not final.'],
  ]),
  'softens closure',
  'Tonic function without a root-position close.',
  1,
);

const settleToRoot = makeCandidate(
  'ci2',
  'settle-to-root',
  'Settle to root',
  'The same V, but landing on root-position tonic — as closed as this melody gets.',
  [
    harmony('ci2-h1', gMajor, 'V', deg(5, 'sol'), ['dominant'], at(1, 1), Q, 'G2', 'G'),
    harmony('ci2-h2', cMajor, 'I', deg(1, 'do'), ['tonic'], at(1, 2), DOTTED_HALF, 'C3', 'C'),
  ],
  voiceEvents('ci2', 'alto', [
    ['B3', 7, 'ti', at(1, 1), Q],
    ['C4', 1, 'do', at(1, 2), DOTTED_HALF],
  ]),
  voiceEvents('ci2', 'tenor', [
    ['G3', 5, 'sol', at(1, 1), Q],
    ['G3', 5, 'sol', at(1, 2), DOTTED_HALF],
  ]),
  voiceEvents('ci2', 'bass', [
    ['G2', 5, 'sol', at(1, 1), Q],
    ['C3', 1, 'do', at(1, 2), DOTTED_HALF],
  ]),
  interp('ci2', [
    ['c6-mel-re', ['ci2-h1'], 'chord_tone', 'Re is the fifth of V.'],
    ['c6-mel-mi', ['ci2-h2'], 'chord_tone', 'Mi rests on a fully closed tonic.'],
  ]),
  'settles now',
  'Root position gives the strongest local close.',
  2,
);

const predominantColor = makeCandidate(
  'ci3',
  'predominant-color',
  'Predominant color',
  'Open with ii6 so re is harmonized by its own chord before I6.',
  [
    harmony('ci3-h1', dMinor, 'ii6', deg(2, 're'), ['predominant'], at(1, 1), Q, 'F3', 'Dm/F', 1),
    harmony('ci3-h2', cMajor, 'I6', deg(1, 'do'), ['tonic'], at(1, 2), DOTTED_HALF, 'E3', 'C/E', 1),
  ],
  voiceEvents('ci3', 'alto', [
    ['D4', 2, 're', at(1, 1), Q],
    ['C4', 1, 'do', at(1, 2), DOTTED_HALF],
  ]),
  voiceEvents('ci3', 'tenor', [
    ['A3', 6, 'la', at(1, 1), Q],
    ['G3', 5, 'sol', at(1, 2), DOTTED_HALF],
  ]),
  voiceEvents('ci3', 'bass', [
    ['F3', 4, 'fa', at(1, 1), Q],
    ['E3', 3, 'mi', at(1, 2), DOTTED_HALF],
  ]),
  interp('ci3', [
    ['c6-mel-re', ['ci3-h1'], 'chord_tone', 'Re is the root of ii, sounding in first inversion.'],
    ['c6-mel-mi', ['ci3-h2'], 'chord_tone', 'Mi arrives over the open first-inversion tonic.'],
  ]),
  'colored and open',
  'A predominant shade with no closure at all.',
  3,
);

export const cMajorReMiContinueI6 = {
  id: 'c-major-re-mi-continue-i6',
  name: 'Re approaching mi — I6',
  match: {
    tonalContext: { tonicPitchClass: 0, mode: 'major' },
    melodySignature: 're4:q|mi4:3/4',
    phraseIntent: 'continue',
  },
  initialState: {
    tonalContext,
    phraseIntent: 'continue',
    tempoBpm: 76,
    acceptedContext: { previousHarmony, previousVoicing: null },
    fragment: melodyFragment,
    boundaryConstraints: [{ afterMelodyEventId: 'c6-mel-re', policy: 'allowed' }],
  },
  candidateSets: [
    {
      id: 'default',
      candidates: [tonicWithoutClosing, settleToRoot, predominantColor],
    },
  ],
} satisfies HarmonizationFixture;
