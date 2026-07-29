/**
 * Fixture A's authored lock-alternative sets (spec §10.6, §17.1).
 *
 * Each set's candidates contain EXACTLY the notes named by its lockSignature
 * (integrity-tested via parseLockSignature): lock candidate A's held bass and
 * you get three readings over an unmoved do; lock candidate B's sol→do bass
 * and you get three dominant-flavored arrivals over that exact line.
 */

import type { AnalysisEvidence, CandidatePath, MelodyInterpretation } from '../../domain/analysis-types';
import type { FixtureCandidateSet } from '../../domain/fixture-types';
import type {
  ChordStructure,
  HarmonyEvent,
  MusicalTime,
  RationalDuration,
  ScaleDegreePitch,
  VoiceEvent,
  VoiceId,
} from '../../domain/music-types';
import { at, deg, H, pc, pitch, Q, W } from '../authoring';
import { cMajorTriad, g7Chord, fixtureProvenance, FIXTURE_ID, initialState, sopranoFromMelody } from './shared';

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
  inversion: 0 | 1 | 2 = 0,
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
    ...(inversion > 0 ? { figuredBass: inversion === 1 ? '6' : '6/4' } : {}),
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

function lockEvidence(prefix: string, note: string): AnalysisEvidence[] {
  return [
    {
      id: `${prefix}-ev-1`,
      source: 'computed',
      featureId: 'locked_bass_preserved',
      value: true,
      explanation: note,
      providerId: 'fixture',
      providerVersion: '0.1.0',
    },
  ];
}

const base = {
  tonalContext: initialState.tonalContext,
  phraseIntent: initialState.phraseIntent,
  provenance: fixtureProvenance,
  fixtureId: FIXTURE_ID,
};

/* ---------- set 1: candidate A's held bass (do — do) ---------- */

const groundedVariant: CandidatePath = {
  id: 'la-grounded-descent',
  fixtureId: base.fixtureId,
  title: 'Grounded descent',
  summary: 'Hold tonic while fa passes through the soprano line.',
  tonalContext: base.tonalContext,
  phraseIntent: base.phraseIntent,
  harmonyEvents: [
    harmony('la1-h1', cMajorTriad, 'I', deg(1, 'do'), ['tonic', 'tonic_prolongation'], at(1, 1), W, 'C3', 'C'),
  ],
  voicing: {
    soprano: sopranoFromMelody('la1'),
    alto: voiceEvents('la1', 'alto', [['E4', 3, 'mi', at(1, 1), W]]),
    tenor: voiceEvents('la1', 'tenor', [['G3', 5, 'sol', at(1, 1), W]]),
    bass: voiceEvents('la1', 'bass', [['C3', 1, 'do', at(1, 1), W]]),
  },
  melodyInterpretations: interp('la1', [
    ['mel-sol', ['la1-h1'], 'chord_tone', 'Sol is the fifth of the held tonic.'],
    ['mel-fa', ['la1-h1'], 'passing_tone', 'Fa passes between two chord tones over the pedal.'],
    ['mel-mi', ['la1-h1'], 'chord_tone', 'Mi is the third of the held tonic.'],
  ]),
  descriptors: [
    {
      id: 'la1-desc',
      dimension: 'stability',
      label: 'calm and grounded',
      explanation: 'Nothing moves beneath the melody.',
      evidenceIds: ['la1-ev-1'],
      source: 'curated',
    },
  ],
  evidence: lockEvidence('la1', 'The locked bass do is untouched.'),
  rank: 1,
  provenance: base.provenance,
};

const pedalFourth: CandidatePath = {
  id: 'la-pedal-fourth',
  fixtureId: base.fixtureId,
  title: 'Pedal fourth',
  summary: 'Let IV sound over the held do — fa becomes a chord tone.',
  tonalContext: base.tonalContext,
  phraseIntent: base.phraseIntent,
  harmonyEvents: [
    harmony('la2-h1', cMajorTriad, 'I', deg(1, 'do'), ['tonic'], at(1, 1), Q, 'C3', 'C'),
    harmony('la2-h2', fMajor, 'IV6/4', deg(4, 'fa'), ['predominant', 'pedal'], at(1, 2), Q, 'C3', 'F/C', 2),
    harmony('la2-h3', cMajorTriad, 'I', deg(1, 'do'), ['tonic'], at(1, 3), H, 'C3', 'C'),
  ],
  voicing: {
    soprano: sopranoFromMelody('la2'),
    alto: voiceEvents('la2', 'alto', [
      ['E4', 3, 'mi', at(1, 1), Q],
      ['C4', 1, 'do', at(1, 2), Q],
      ['E4', 3, 'mi', at(1, 3), H],
    ]),
    tenor: voiceEvents('la2', 'tenor', [
      ['G3', 5, 'sol', at(1, 1), Q],
      ['A3', 6, 'la', at(1, 2), Q],
      ['G3', 5, 'sol', at(1, 3), H],
    ]),
    bass: voiceEvents('la2', 'bass', [['C3', 1, 'do', at(1, 1), W]]),
  },
  melodyInterpretations: interp('la2', [
    ['mel-sol', ['la2-h1'], 'chord_tone', 'Sol is the fifth of the tonic.'],
    ['mel-fa', ['la2-h2'], 'chord_tone', 'Fa is the root of IV, colored over the pedal do.'],
    ['mel-mi', ['la2-h3'], 'chord_tone', 'Mi is the third of the returning tonic.'],
  ]),
  descriptors: [
    {
      id: 'la2-desc',
      dimension: 'brightness',
      label: 'pedal color',
      explanation: 'The subdominant glows briefly without the bass ever moving.',
      evidenceIds: ['la2-ev-1'],
      source: 'curated',
    },
  ],
  evidence: lockEvidence('la2', 'IV sounds over the locked pedal do.'),
  rank: 2,
  provenance: base.provenance,
};

const innerWeave: CandidatePath = {
  id: 'la-inner-weave',
  fixtureId: base.fixtureId,
  title: 'Inner weave',
  summary: 'Keep the harmony still and let the inner voices walk.',
  tonalContext: base.tonalContext,
  phraseIntent: base.phraseIntent,
  harmonyEvents: [
    harmony('la3-h1', cMajorTriad, 'I', deg(1, 'do'), ['tonic', 'tonic_prolongation'], at(1, 1), W, 'C3', 'C'),
  ],
  voicing: {
    soprano: sopranoFromMelody('la3'),
    alto: voiceEvents('la3', 'alto', [
      ['E4', 3, 'mi', at(1, 1), Q],
      ['D4', 2, 're', at(1, 2), Q],
      ['E4', 3, 'mi', at(1, 3), H],
    ]),
    tenor: voiceEvents('la3', 'tenor', [
      ['G3', 5, 'sol', at(1, 1), Q],
      ['A3', 6, 'la', at(1, 2), Q],
      ['G3', 5, 'sol', at(1, 3), H],
    ]),
    bass: voiceEvents('la3', 'bass', [['C3', 1, 'do', at(1, 1), W]]),
  },
  melodyInterpretations: interp('la3', [
    ['mel-sol', ['la3-h1'], 'chord_tone', 'Sol is the fifth of the held tonic.'],
    ['mel-fa', ['la3-h1'], 'passing_tone', 'Fa passes while alto and tenor mirror it with neighbors.'],
    ['mel-mi', ['la3-h1'], 'chord_tone', 'Mi settles the weave back onto the triad.'],
  ]),
  descriptors: [
    {
      id: 'la3-desc',
      dimension: 'voice_leading_ease',
      label: 'gentle inner motion',
      explanation: 'The middle voices breathe without changing the harmony.',
      evidenceIds: ['la3-ev-1'],
      source: 'curated',
    },
  ],
  evidence: lockEvidence('la3', 'The locked bass do never moves.'),
  rank: 3,
  provenance: base.provenance,
};

/* ---------- set 2: candidate B's bass line (sol → do) ---------- */

const arrivalVariant: CandidatePath = {
  id: 'lb-strong-arrival',
  fixtureId: base.fixtureId,
  title: 'Strong arrival',
  summary: 'Use fa as the seventh of V7 and resolve it downward to mi.',
  tonalContext: base.tonalContext,
  phraseIntent: base.phraseIntent,
  harmonyEvents: [
    harmony('lb1-h1', g7Chord, 'V7', deg(5, 'sol'), ['dominant'], at(1, 1), H, 'G2', 'G7'),
    harmony('lb1-h2', cMajorTriad, 'I', deg(1, 'do'), ['tonic'], at(1, 3), H, 'C3', 'C'),
  ],
  voicing: {
    soprano: sopranoFromMelody('lb1'),
    alto: voiceEvents('lb1', 'alto', [
      ['B3', 7, 'ti', at(1, 1), H],
      ['C4', 1, 'do', at(1, 3), H],
    ]),
    tenor: voiceEvents('lb1', 'tenor', [
      ['G3', 5, 'sol', at(1, 1), H],
      ['G3', 5, 'sol', at(1, 3), H],
    ]),
    bass: voiceEvents('lb1', 'bass', [
      ['G2', 5, 'sol', at(1, 1), H],
      ['C3', 1, 'do', at(1, 3), H],
    ]),
  },
  melodyInterpretations: interp('lb1', [
    ['mel-sol', ['lb1-h1'], 'chord_tone', 'Sol is the root of V7.'],
    ['mel-fa', ['lb1-h1'], 'chord_tone', 'Fa is the chordal seventh, resolving down to mi.'],
    ['mel-mi', ['lb1-h2'], 'chord_tone', 'Mi is the third of the arriving tonic.'],
  ]),
  descriptors: [
    {
      id: 'lb1-desc',
      dimension: 'closure_strength',
      label: 'strong dominant arrival',
      explanation: 'The full seventh chord presses into the tonic.',
      evidenceIds: ['lb1-ev-1'],
      source: 'curated',
    },
  ],
  evidence: lockEvidence('lb1', 'The locked sol→do bass carries a complete V7–I.'),
  rank: 1,
  provenance: base.provenance,
};

const plainDominant: CandidatePath = {
  id: 'lb-plain-dominant',
  fixtureId: base.fixtureId,
  title: 'Plain dominant',
  summary: 'A triadic V lets fa pass instead of demanding resolution.',
  tonalContext: base.tonalContext,
  phraseIntent: base.phraseIntent,
  harmonyEvents: [
    harmony('lb2-h1', gMajor, 'V', deg(5, 'sol'), ['dominant'], at(1, 1), H, 'G2', 'G'),
    harmony('lb2-h2', cMajorTriad, 'I', deg(1, 'do'), ['tonic'], at(1, 3), H, 'C3', 'C'),
  ],
  voicing: {
    soprano: sopranoFromMelody('lb2'),
    alto: voiceEvents('lb2', 'alto', [
      ['D4', 2, 're', at(1, 1), H],
      ['C4', 1, 'do', at(1, 3), H],
    ]),
    tenor: voiceEvents('lb2', 'tenor', [
      ['B3', 7, 'ti', at(1, 1), H],
      ['C4', 1, 'do', at(1, 3), H],
    ]),
    bass: voiceEvents('lb2', 'bass', [
      ['G2', 5, 'sol', at(1, 1), H],
      ['C3', 1, 'do', at(1, 3), H],
    ]),
  },
  melodyInterpretations: interp('lb2', [
    ['mel-sol', ['lb2-h1'], 'chord_tone', 'Sol is the root of V.'],
    ['mel-fa', ['lb2-h1'], 'passing_tone', 'Fa is a passing tone over the plain triad.'],
    ['mel-mi', ['lb2-h2'], 'chord_tone', 'Mi is the third of the tonic.'],
  ]),
  descriptors: [
    {
      id: 'lb2-desc',
      dimension: 'tension',
      label: 'softer dominant',
      explanation: 'Without the seventh, the pull toward tonic relaxes.',
      evidenceIds: ['lb2-ev-1'],
      source: 'curated',
    },
  ],
  evidence: lockEvidence('lb2', 'Same locked bass, gentler harmony above it.'),
  rank: 2,
  provenance: base.provenance,
};

const cadentialSixFour: CandidatePath = {
  id: 'lb-cadential-six-four',
  fixtureId: base.fixtureId,
  title: 'Cadential 6-4',
  summary: 'Tonic tones lean on the dominant bass before V7 resolves home.',
  tonalContext: base.tonalContext,
  phraseIntent: base.phraseIntent,
  harmonyEvents: [
    harmony('lb3-h1', cMajorTriad, 'I6/4', deg(1, 'do'), ['dominant_prolongation'], at(1, 1), Q, 'G2', 'C/G', 2),
    harmony('lb3-h2', g7Chord, 'V7', deg(5, 'sol'), ['dominant'], at(1, 2), Q, 'G2', 'G7'),
    harmony('lb3-h3', cMajorTriad, 'I', deg(1, 'do'), ['tonic'], at(1, 3), H, 'C3', 'C'),
  ],
  voicing: {
    soprano: sopranoFromMelody('lb3'),
    alto: voiceEvents('lb3', 'alto', [
      ['E4', 3, 'mi', at(1, 1), Q],
      ['D4', 2, 're', at(1, 2), Q],
      ['E4', 3, 'mi', at(1, 3), H],
    ]),
    tenor: voiceEvents('lb3', 'tenor', [
      ['C4', 1, 'do', at(1, 1), Q],
      ['B3', 7, 'ti', at(1, 2), Q],
      ['C4', 1, 'do', at(1, 3), H],
    ]),
    bass: voiceEvents('lb3', 'bass', [
      ['G2', 5, 'sol', at(1, 1), H],
      ['C3', 1, 'do', at(1, 3), H],
    ]),
  },
  melodyInterpretations: interp('lb3', [
    ['mel-sol', ['lb3-h1'], 'chord_tone', 'Sol doubles the dominant bass under tonic tones — the classic 6-4.'],
    ['mel-fa', ['lb3-h2'], 'chord_tone', 'Fa is the seventh as the 6-4 resolves into V7.'],
    ['mel-mi', ['lb3-h3'], 'chord_tone', 'Mi is the third of the tonic arrival.'],
  ]),
  descriptors: [
    {
      id: 'lb3-desc',
      dimension: 'closure_strength',
      label: 'formal cadence',
      explanation: 'The most ceremonial reading of this bass line.',
      evidenceIds: ['lb3-ev-1'],
      source: 'curated',
    },
  ],
  evidence: lockEvidence('lb3', 'The 6-4 and its resolution share the locked bass exactly.'),
  rank: 3,
  provenance: base.provenance,
};

export const lockedBassGrounded: FixtureCandidateSet = {
  id: 'locked-bass-grounded',
  lockSignature: 'bass@0:16=C3',
  candidates: [groundedVariant, pedalFourth, innerWeave],
};

export const lockedBassArrival: FixtureCandidateSet = {
  id: 'locked-bass-arrival',
  lockSignature: 'bass@0:8=G2|bass@8:8=C3',
  candidates: [arrivalVariant, plainDominant, cadentialSixFour],
};
