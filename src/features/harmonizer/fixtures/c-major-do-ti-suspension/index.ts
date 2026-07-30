/**
 * Fixture B — do held into ti (spec §11.2). The point: a suspension is an
 * interpretation ACROSS a harmonic change (the harmony moves to V while the
 * melody's do still sounds), never a standalone peer chord.
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
import { at, deg, H, pc, pitch, Q } from '../authoring';

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

const tonalContext = {
  tonic: pc('C'),
  tonicPitchClass: 0,
  mode: 'major' as const,
  solfegeSystem: 'movable_do' as const,
};

const melodyFragment = {
  id: 'fragment-do-ti',
  events: [
    {
      id: 'b-mel-do',
      pitch: pitch('C5'),
      scaleDegree: deg(1, 'do'),
      start: at(1, 1),
      duration: DOTTED_HALF,
      tieFromPrevious: false,
      metricStrength: 'strong' as const,
    },
    {
      id: 'b-mel-ti',
      pitch: pitch('B4'),
      scaleDegree: deg(7, 'ti'),
      start: at(1, 4),
      duration: Q,
      tieFromPrevious: false,
      metricStrength: 'weak' as const,
    },
  ],
};

const previousHarmony: HarmonyEvent = {
  id: 'b-ctx-tonic',
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
    [string, Parameters<typeof deg>[0], Parameters<typeof deg>[1], MusicalTime, RationalDuration, boolean?]
  >,
): VoiceEvent[] {
  return rows.map(([notation, degree, syllable, start, duration, tie], index) => ({
    id: `${prefix}-${voice[0]}-${index + 1}`,
    voice,
    pitch: pitch(notation),
    scaleDegree: deg(degree, syllable),
    start,
    duration,
    tieFromPrevious: tie ?? false,
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
  rows: Array<[string, string[], MelodyInterpretation['role'], string, Partial<MelodyInterpretation>?]>,
): MelodyInterpretation[] {
  return rows.map(([melodyEventId, harmonyEventIds, role, explanation, extra], index) => ({
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
    ...extra,
  }));
}

const suspendedArrival: CandidatePath = {
  id: 'suspended-arrival',
  fixtureId: 'c-major-do-ti-suspension',
  title: 'Suspended arrival',
  summary: 'The harmony moves to V beneath the held do; do resolves as a 4–3 suspension.',
  tonalContext,
  phraseIntent: 'close',
  harmonyEvents: [
    harmony('bs1-h1', cMajor, 'I', deg(1, 'do'), ['tonic'], at(1, 1), H, 'C3', 'C'),
    harmony('bs1-h2', gMajor, 'V', deg(5, 'sol'), ['dominant'], at(1, 3), H, 'G2', 'G'),
  ],
  voicing: {
    soprano: soprano('bs1'),
    alto: voiceEvents('bs1', 'alto', [
      ['E4', 3, 'mi', at(1, 1), H],
      ['D4', 2, 're', at(1, 3), H],
    ]),
    tenor: voiceEvents('bs1', 'tenor', [
      ['G3', 5, 'sol', at(1, 1), H],
      ['G3', 5, 'sol', at(1, 3), H, true],
    ]),
    bass: voiceEvents('bs1', 'bass', [
      ['C3', 1, 'do', at(1, 1), H],
      ['G2', 5, 'sol', at(1, 3), H],
    ]),
  },
  melodyInterpretations: interp('bs1', [
    [
      'b-mel-do',
      ['bs1-h1', 'bs1-h2'],
      'suspension',
      'Do is a chord tone of I, then hangs over V as a 4–3 suspension before falling to ti.',
      { suspensionType: '4-3', resolutionEventId: 'b-mel-ti' },
    ],
    ['b-mel-ti', ['bs1-h2'], 'chord_tone', 'Ti is the third of V — the suspension’s resolution.'],
  ]),
  descriptors: [
    {
      id: 'bs1-desc',
      dimension: 'tension',
      label: 'held breath',
      explanation: 'The dissonance over the dominant delays the release by one beat.',
      evidenceIds: ['bs1-ev-1'],
      source: 'curated',
    },
  ],
  evidence: [
    {
      id: 'bs1-ev-1',
      source: 'rule',
      featureId: 'suspension_pattern',
      value: '4-3',
      explanation: 'Prepared dissonance, held across the change, resolving down by step.',
      providerId: 'poc-hymn-major-v1',
      providerVersion: '0.1.0',
    },
  ],
  rank: 1,
  provenance,
};

const leaningAppoggiatura: CandidatePath = {
  id: 'leaning-appoggiatura',
  fixtureId: 'c-major-do-ti-suspension',
  title: 'Leaning appoggiatura',
  summary: 'Hear the held do as leaning into V from above rather than suspended.',
  tonalContext,
  phraseIntent: 'close',
  harmonyEvents: [
    harmony('bs2-h1', cMajor, 'I', deg(1, 'do'), ['tonic'], at(1, 1), H, 'C3', 'C'),
    harmony('bs2-h2', gMajor, 'V', deg(5, 'sol'), ['dominant'], at(1, 3), H, 'G3', 'G'),
  ],
  voicing: {
    soprano: soprano('bs2'),
    alto: voiceEvents('bs2', 'alto', [
      ['E4', 3, 'mi', at(1, 1), H],
      ['D4', 2, 're', at(1, 3), H],
    ]),
    tenor: voiceEvents('bs2', 'tenor', [
      ['G3', 5, 'sol', at(1, 1), H],
      ['B3', 7, 'ti', at(1, 3), H],
    ]),
    bass: voiceEvents('bs2', 'bass', [
      ['C3', 1, 'do', at(1, 1), H],
      ['G3', 5, 'sol', at(1, 3), H],
    ]),
  },
  melodyInterpretations: interp('bs2', [
    [
      'b-mel-do',
      ['bs2-h1', 'bs2-h2'],
      'appoggiatura',
      'Over V the held do reads as an accented leaning tone resolving to ti.',
      { resolutionEventId: 'b-mel-ti' },
    ],
    ['b-mel-ti', ['bs2-h2'], 'chord_tone', 'Ti is the third of V.'],
  ]),
  descriptors: [
    {
      id: 'bs2-desc',
      dimension: 'brightness',
      label: 'leaning color',
      explanation: 'A lighter reading of the same dissonance.',
      evidenceIds: ['bs2-ev-1'],
      source: 'curated',
    },
  ],
  evidence: [
    {
      id: 'bs2-ev-1',
      source: 'curated',
      featureId: 'reading_label',
      value: 'appoggiatura',
      explanation: 'Same notes, different narrative — a reading, not a fact.',
      providerId: 'poc-hymn-major-v1',
      providerVersion: '0.1.0',
    },
  ],
  rank: 2,
  provenance,
};

const tonicToLastMoment: CandidatePath = {
  id: 'tonic-to-last-moment',
  fixtureId: 'c-major-do-ti-suspension',
  title: 'Tonic to the last moment',
  summary: 'Keep tonic under the whole held do; V arrives only with ti.',
  tonalContext,
  phraseIntent: 'close',
  harmonyEvents: [
    harmony('bs3-h1', cMajor, 'I', deg(1, 'do'), ['tonic'], at(1, 1), DOTTED_HALF, 'C3', 'C'),
    harmony('bs3-h2', gMajor, 'V', deg(5, 'sol'), ['dominant'], at(1, 4), Q, 'G2', 'G'),
  ],
  voicing: {
    soprano: soprano('bs3'),
    alto: voiceEvents('bs3', 'alto', [
      ['E4', 3, 'mi', at(1, 1), DOTTED_HALF],
      ['D4', 2, 're', at(1, 4), Q],
    ]),
    tenor: voiceEvents('bs3', 'tenor', [
      ['G3', 5, 'sol', at(1, 1), DOTTED_HALF],
      ['G3', 5, 'sol', at(1, 4), Q, true],
    ]),
    bass: voiceEvents('bs3', 'bass', [
      ['C3', 1, 'do', at(1, 1), DOTTED_HALF],
      ['G2', 5, 'sol', at(1, 4), Q],
    ]),
  },
  melodyInterpretations: interp('bs3', [
    ['b-mel-do', ['bs3-h1'], 'chord_tone', 'Do is simply the root of the held tonic.'],
    ['b-mel-ti', ['bs3-h2'], 'chord_tone', 'Ti arrives together with its dominant.'],
  ]),
  descriptors: [
    {
      id: 'bs3-desc',
      dimension: 'stability',
      label: 'plainest reading',
      explanation: 'No dissonance at all — the harmony waits for the melody.',
      evidenceIds: ['bs3-ev-1'],
      source: 'curated',
    },
  ],
  evidence: [
    {
      id: 'bs3-ev-1',
      source: 'computed',
      featureId: 'dissonance_count',
      value: 0,
      explanation: 'Every melody note is a chord tone of its own harmony.',
      providerId: 'fixture',
      providerVersion: '0.1.0',
    },
  ],
  rank: 3,
  provenance,
};

export const cMajorDoTiSuspension = {
  id: 'c-major-do-ti-suspension',
  name: 'Held do into ti — suspension',
  match: {
    tonalContext: { tonicPitchClass: 0, mode: 'major' },
    melodySignature: 'do5:3/4|ti4:q',
    phraseIntent: 'close',
  },
  initialState: {
    tonalContext,
    phraseIntent: 'close',
    tempoBpm: 72,
    acceptedContext: { previousHarmony, previousVoicing: null },
    fragment: melodyFragment,
    boundaryConstraints: [{ afterMelodyEventId: 'b-mel-do', policy: 'allowed' }],
  },
  candidateSets: [
    {
      id: 'default',
      candidates: [suspendedArrival, leaningAppoggiatura, tonicToLastMoment],
    },
  ],
} satisfies HarmonizationFixture;
