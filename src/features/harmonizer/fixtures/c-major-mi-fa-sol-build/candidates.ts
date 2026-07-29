/**
 * Fixture D candidates — three authored builds over mi–fa–sol.
 */

import type { AnalysisEvidence, CandidatePath, MelodyInterpretation } from '../../domain/analysis-types';
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
import { fixtureProvenance, FIXTURE_D_ID, initialState, sopranoFromMelody } from './shared';

const cMajor: ChordStructure = {
  id: 'chord-c-major',
  root: pc('C'),
  pitchClasses: [0, 4, 7],
  spelledChordTones: [pc('C'), pc('E'), pc('G')],
  quality: 'major',
};
const fMajor: ChordStructure = {
  id: 'chord-f-major',
  root: pc('F'),
  pitchClasses: [5, 9, 0],
  spelledChordTones: [pc('F'), pc('A'), pc('C')],
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
const eMinor: ChordStructure = {
  id: 'chord-e-minor',
  root: pc('E'),
  pitchClasses: [4, 7, 11],
  spelledChordTones: [pc('E'), pc('G'), pc('B')],
  quality: 'minor',
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

function chordToneInterpretations(
  prefix: string,
  rows: Array<[string, string, string]>, // [melodyEventId, harmonyEventId, explanation]
): MelodyInterpretation[] {
  return rows.map(([melodyEventId, harmonyEventId, explanation], index) => ({
    melodyEventId,
    harmonyEventIds: [harmonyEventId],
    role: 'chord_tone' as const,
    explanation,
    evidence: [
      {
        id: `${prefix}-int-${index + 1}`,
        source: 'computed' as const,
        featureId: 'chord_membership',
        value: true,
        explanation,
        providerId: 'fixture',
        providerVersion: '0.1.0',
      },
    ],
  }));
}

function buildEvidence(prefix: string): AnalysisEvidence[] {
  return [
    {
      id: `${prefix}-ev-1`,
      source: 'computed',
      featureId: 'root_motion',
      value: 'ascending',
      explanation: 'The roots rise toward the dominant.',
      providerId: 'fixture',
      providerVersion: '0.1.0',
    },
    {
      id: `${prefix}-ev-2`,
      source: 'rule',
      featureId: 'dominant_preparation',
      value: true,
      explanation: 'Ending on V leaves the phrase leaning forward.',
      providerId: 'poc-hymn-major-v1',
      providerVersion: '0.1.0',
    },
  ];
}

const shared = {
  tonalContext: initialState.tonalContext,
  phraseIntent: initialState.phraseIntent,
  provenance: fixtureProvenance,
  fixtureId: FIXTURE_D_ID,
};

export const candidateD1: CandidatePath = {
  id: 'toward-the-dominant',
  fixtureId: shared.fixtureId,
  title: 'Toward the dominant',
  summary: 'Step the harmony up with the melody: tonic, subdominant, dominant.',
  tonalContext: shared.tonalContext,
  phraseIntent: shared.phraseIntent,
  harmonyEvents: [
    harmony('d1-h1', cMajor, 'I', deg(1, 'do'), ['tonic'], at(1, 1), Q, 'C3', 'C'),
    harmony('d1-h2', fMajor, 'IV', deg(4, 'fa'), ['predominant'], at(1, 2), Q, 'F3', 'F'),
    harmony('d1-h3', gMajor, 'V', deg(5, 'sol'), ['dominant'], at(1, 3), H, 'G2', 'G'),
  ],
  voicing: {
    soprano: sopranoFromMelody('d1'),
    alto: voiceEvents('d1', 'alto', [
      ['C4', 1, 'do', at(1, 1), Q],
      ['C4', 1, 'do', at(1, 2), Q],
      ['D4', 2, 're', at(1, 3), H],
    ]),
    tenor: voiceEvents('d1', 'tenor', [
      ['G3', 5, 'sol', at(1, 1), Q],
      ['A3', 6, 'la', at(1, 2), Q],
      ['B3', 7, 'ti', at(1, 3), H],
    ]),
    bass: voiceEvents('d1', 'bass', [
      ['C3', 1, 'do', at(1, 1), Q],
      ['F3', 4, 'fa', at(1, 2), Q],
      ['G2', 5, 'sol', at(1, 3), H],
    ]),
  },
  melodyInterpretations: chordToneInterpretations('d1', [
    ['d-mel-mi', 'd1-h1', 'Mi is the third of the tonic triad.'],
    ['d-mel-fa', 'd1-h2', 'Fa is the root of the subdominant.'],
    ['d-mel-sol', 'd1-h3', 'Sol is the root of the dominant.'],
  ]),
  descriptors: [
    {
      id: 'd1-desc-motion',
      dimension: 'forward_motion',
      label: 'rising toward the dominant',
      explanation: 'Each melody step gets its own rising chord, ending on V.',
      evidenceIds: ['d1-ev-1', 'd1-ev-2'],
      source: 'curated',
    },
    {
      id: 'd1-desc-tension',
      dimension: 'tension',
      label: 'builds pressure',
      explanation: 'The phrase gathers energy without resolving it.',
      evidenceIds: ['d1-ev-2'],
      source: 'curated',
    },
  ],
  evidence: buildEvidence('d1'),
  rank: 1,
  provenance: shared.provenance,
};

export const candidateD2: CandidatePath = {
  id: 'predominant-lean',
  fixtureId: shared.fixtureId,
  title: 'Predominant lean',
  summary: 'Pass through ii6 so the bass keeps rising into the dominant.',
  tonalContext: shared.tonalContext,
  phraseIntent: shared.phraseIntent,
  harmonyEvents: [
    harmony('d2-h1', cMajor, 'I', deg(1, 'do'), ['tonic'], at(1, 1), Q, 'C3', 'C'),
    harmony('d2-h2', dMinor, 'ii6', deg(2, 're'), ['predominant'], at(1, 2), Q, 'F3', 'Dm/F', 1),
    harmony('d2-h3', gMajor, 'V', deg(5, 'sol'), ['dominant'], at(1, 3), H, 'G2', 'G'),
  ],
  voicing: {
    soprano: sopranoFromMelody('d2'),
    alto: voiceEvents('d2', 'alto', [
      ['C4', 1, 'do', at(1, 1), Q],
      ['D4', 2, 're', at(1, 2), Q],
      ['D4', 2, 're', at(1, 3), H],
    ]),
    tenor: voiceEvents('d2', 'tenor', [
      ['G3', 5, 'sol', at(1, 1), Q],
      ['A3', 6, 'la', at(1, 2), Q],
      ['B3', 7, 'ti', at(1, 3), H],
    ]),
    bass: voiceEvents('d2', 'bass', [
      ['C3', 1, 'do', at(1, 1), Q],
      ['F3', 4, 'fa', at(1, 2), Q],
      ['G2', 5, 'sol', at(1, 3), H],
    ]),
  },
  melodyInterpretations: chordToneInterpretations('d2', [
    ['d-mel-mi', 'd2-h1', 'Mi is the third of the tonic triad.'],
    ['d-mel-fa', 'd2-h2', 'Fa is the third of ii, sounding in first inversion.'],
    ['d-mel-sol', 'd2-h3', 'Sol is the root of the dominant; the alto holds re as a common tone.'],
  ]),
  descriptors: [
    {
      id: 'd2-desc-motion',
      dimension: 'forward_motion',
      label: 'classic predominant approach',
      explanation: 'ii6 prepares the dominant while the bass walks up do–fa–sol.',
      evidenceIds: ['d2-ev-1', 'd2-ev-2'],
      source: 'curated',
    },
    {
      id: 'd2-desc-style',
      dimension: 'style_fit',
      label: 'hymn-idiomatic',
      explanation: 'The commonest build in congregational four-part writing.',
      evidenceIds: ['d2-ev-2'],
      source: 'curated',
    },
  ],
  evidence: buildEvidence('d2'),
  rank: 2,
  provenance: shared.provenance,
};

export const candidateD3: CandidatePath = {
  id: 'stepwise-color',
  fixtureId: shared.fixtureId,
  title: 'Stepwise color',
  summary: 'Let the mediant color the opening before IV and V take over.',
  tonalContext: shared.tonalContext,
  phraseIntent: shared.phraseIntent,
  harmonyEvents: [
    harmony('d3-h1', eMinor, 'iii', deg(3, 'mi'), ['tonic_prolongation'], at(1, 1), Q, 'E3', 'Em'),
    harmony('d3-h2', fMajor, 'IV', deg(4, 'fa'), ['predominant'], at(1, 2), Q, 'F3', 'F'),
    harmony('d3-h3', gMajor, 'V', deg(5, 'sol'), ['dominant'], at(1, 3), H, 'G2', 'G'),
  ],
  voicing: {
    soprano: sopranoFromMelody('d3'),
    alto: voiceEvents('d3', 'alto', [
      ['B3', 7, 'ti', at(1, 1), Q],
      ['C4', 1, 'do', at(1, 2), Q],
      ['D4', 2, 're', at(1, 3), H],
    ]),
    tenor: voiceEvents('d3', 'tenor', [
      ['G3', 5, 'sol', at(1, 1), Q],
      ['A3', 6, 'la', at(1, 2), Q],
      ['B3', 7, 'ti', at(1, 3), H],
    ]),
    bass: voiceEvents('d3', 'bass', [
      ['E3', 3, 'mi', at(1, 1), Q],
      ['F3', 4, 'fa', at(1, 2), Q],
      ['G2', 5, 'sol', at(1, 3), H],
    ]),
  },
  melodyInterpretations: chordToneInterpretations('d3', [
    ['d-mel-mi', 'd3-h1', 'Mi is the root of the mediant.'],
    ['d-mel-fa', 'd3-h2', 'Fa is the root of the subdominant.'],
    ['d-mel-sol', 'd3-h3', 'Sol is the root of the dominant.'],
  ]),
  descriptors: [
    {
      id: 'd3-desc-color',
      dimension: 'brightness',
      label: 'color option',
      explanation: 'The mediant opening is darker and less expected than plain tonic.',
      evidenceIds: ['d3-ev-1'],
      source: 'curated',
    },
    {
      id: 'd3-desc-motion',
      dimension: 'forward_motion',
      label: 'stepwise rise',
      explanation: 'Roots climb by step, mirroring the melody into the dominant.',
      evidenceIds: ['d3-ev-1', 'd3-ev-2'],
      source: 'curated',
    },
  ],
  evidence: buildEvidence('d3'),
  rank: 3,
  provenance: shared.provenance,
};
