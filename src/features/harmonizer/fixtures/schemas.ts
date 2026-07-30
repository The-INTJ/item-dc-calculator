/**
 * Zod schemas for the two trust boundaries: fixture data (validated at module
 * load, spec 17.2) and localStorage project data (projects/project-store.ts
 * imports the exported building blocks).
 *
 * Hand-written interfaces in domain/ are the source of truth; each schema is
 * annotated `z.ZodType<X>` so any drift between schema and interface is a
 * compile error.
 */

import { z } from 'zod';
import type {
  AnalysisEvidence,
  CandidatePath,
  CandidateProvenance,
  DerivabilityNote,
  EffectDescriptor,
  MelodyInterpretation,
  RankingDimensions,
} from '../domain/analysis-types';
import type { ApproachContext } from '../domain/approach';
import type {
  FixtureCandidateSet,
  FixtureInitialState,
  FixtureMatchCriteria,
  HarmonizationFixture,
  TonalContextMatch,
} from '../domain/fixture-types';
import type {
  BoundaryConstraint,
  ChordStructure,
  HarmonicAnalysis,
  HarmonyEvent,
  MelodyEvent,
  MelodyFragment,
  MusicalTime,
  RationalDuration,
  SATBVoicing,
  ScaleDegreePitch,
  SpelledPitch,
  SpelledPitchClass,
  TonalContext,
  VoiceEvent,
} from '../domain/music-types';
import type { AcceptedContext } from '../domain/workbench-state';
import { computeMidi, computePitchClass } from './authoring';

const LetterNameSchema = z.enum(['C', 'D', 'E', 'F', 'G', 'A', 'B']);
const AccidentalSchema = z.enum(['bb', 'b', 'natural', '#', 'x']);
const PitchClassNumberSchema = z.number().int().min(0).max(11);

const SpelledPitchSchema: z.ZodType<SpelledPitch> = z
  .strictObject({
    letter: LetterNameSchema,
    accidental: AccidentalSchema,
    octave: z.number().int(),
    midi: z.number().int(),
    pitchClass: PitchClassNumberSchema,
  })
  .refine(
    (pitch) =>
      pitch.midi === computeMidi(pitch.letter, pitch.accidental, pitch.octave) &&
      pitch.pitchClass === ((pitch.midi % 12) + 12) % 12,
    { message: 'midi/pitchClass disagree with the spelled pitch' },
  );

const SpelledPitchClassSchema: z.ZodType<SpelledPitchClass> = z
  .strictObject({
    letter: LetterNameSchema,
    accidental: AccidentalSchema,
    pitchClass: PitchClassNumberSchema,
  })
  .refine((pitch) => pitch.pitchClass === computePitchClass(pitch.letter, pitch.accidental), {
    message: 'pitchClass disagrees with the spelled pitch class',
  });

const DiatonicDegreeSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
  z.literal(7),
]);

const SolfegeSyllableSchema = z.enum([
  'do',
  'di',
  'ra',
  're',
  'ri',
  'me',
  'mi',
  'fa',
  'fi',
  'se',
  'sol',
  'si',
  'le',
  'la',
  'li',
  'te',
  'ti',
]);

const ScaleDegreePitchSchema: z.ZodType<ScaleDegreePitch> = z.strictObject({
  degree: DiatonicDegreeSchema,
  chromaticOffset: z.number().int(),
  syllable: SolfegeSyllableSchema,
});

const ModeIdSchema = z.enum([
  'major',
  'natural_minor',
  'harmonic_minor',
  'melodic_minor',
  'dorian',
  'mixolydian',
]);

export const TonalContextSchema: z.ZodType<TonalContext> = z.strictObject({
  tonic: SpelledPitchClassSchema,
  tonicPitchClass: PitchClassNumberSchema,
  mode: ModeIdSchema,
  solfegeSystem: z.literal('movable_do'),
  minorDoSystem: z.enum(['do_based', 'la_based']).optional(),
});

const MusicalTimeSchema: z.ZodType<MusicalTime> = z.strictObject({
  measure: z.number().int().min(0),
  beat: z.number().int().min(1),
  subdivision: z.number().int().min(0),
});

const RationalDurationSchema: z.ZodType<RationalDuration> = z.strictObject({
  numerator: z.number().int().positive(),
  denominator: z.number().int().positive(),
});

const MelodyEventSchema: z.ZodType<MelodyEvent> = z.strictObject({
  id: z.string().min(1),
  pitch: SpelledPitchSchema,
  scaleDegree: ScaleDegreePitchSchema,
  start: MusicalTimeSchema,
  duration: RationalDurationSchema,
  tieFromPrevious: z.boolean(),
  metricStrength: z.enum(['strong', 'medium', 'weak']).optional(),
  phraseBoundaryAfter: z.enum(['none', 'subphrase', 'phrase', 'stanza']).optional(),
});

export const MelodyFragmentSchema: z.ZodType<MelodyFragment> = z.strictObject({
  id: z.string().min(1),
  events: z.array(MelodyEventSchema),
});

export const BoundaryConstraintSchema: z.ZodType<BoundaryConstraint> = z.strictObject({
  afterMelodyEventId: z.string().min(1),
  policy: z.enum(['hold', 'allowed', 'required']),
});

const ChordQualitySchema = z.enum([
  'major',
  'minor',
  'diminished',
  'augmented',
  'dominant_seventh',
  'major_seventh',
  'minor_seventh',
  'half_diminished_seventh',
  'fully_diminished_seventh',
  'suspended_second',
  'suspended_fourth',
  'other',
]);

const ChordStructureSchema: z.ZodType<ChordStructure> = z.strictObject({
  id: z.string().min(1),
  root: SpelledPitchClassSchema,
  pitchClasses: z.array(PitchClassNumberSchema),
  spelledChordTones: z.array(SpelledPitchClassSchema),
  quality: ChordQualitySchema,
  extensions: z.array(z.string()).optional(),
  alterations: z.array(z.string()).optional(),
});

const HarmonicFunctionTagSchema = z.enum([
  'tonic',
  'tonic_prolongation',
  'predominant',
  'dominant',
  'dominant_prolongation',
  'passing',
  'pedal',
  'ambiguous',
]);

const HarmonicAnalysisSchema: z.ZodType<HarmonicAnalysis> = z.strictObject({
  romanNumeral: z.string().min(1),
  scaleDegreeRoot: ScaleDegreePitchSchema,
  functionTags: z.array(HarmonicFunctionTagSchema),
  appliedTo: z.string().optional(),
  borrowedFrom: ModeIdSchema.optional(),
});

const InversionSchema = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]);

const HarmonyEventSchema: z.ZodType<HarmonyEvent> = z.strictObject({
  id: z.string().min(1),
  start: MusicalTimeSchema,
  duration: RationalDurationSchema,
  chord: ChordStructureSchema,
  analysis: HarmonicAnalysisSchema,
  inversion: InversionSchema,
  bassPitch: SpelledPitchSchema,
  figuredBass: z.string().optional(),
  displaySymbol: z.string().min(1),
});

const VoiceIdSchema = z.enum(['soprano', 'alto', 'tenor', 'bass']);

const VoiceEventSchema: z.ZodType<VoiceEvent> = z.strictObject({
  id: z.string().min(1),
  voice: VoiceIdSchema,
  pitch: SpelledPitchSchema,
  scaleDegree: ScaleDegreePitchSchema,
  start: MusicalTimeSchema,
  duration: RationalDurationSchema,
  tieFromPrevious: z.boolean(),
});

const SATBVoicingSchema: z.ZodType<SATBVoicing> = z.strictObject({
  soprano: z.array(VoiceEventSchema),
  alto: z.array(VoiceEventSchema),
  tenor: z.array(VoiceEventSchema),
  bass: z.array(VoiceEventSchema),
});

const EvidenceSourceSchema = z.enum(['computed', 'rule', 'corpus', 'curated', 'user']);

const AnalysisEvidenceSchema: z.ZodType<AnalysisEvidence> = z.strictObject({
  id: z.string().min(1),
  source: EvidenceSourceSchema,
  featureId: z.string().min(1),
  value: z.union([z.boolean(), z.number(), z.string(), z.array(z.string())]),
  confidence: z.number().min(0).max(1).optional(),
  explanation: z.string().optional(),
  providerId: z.string().min(1),
  providerVersion: z.string().min(1),
});

const MelodyRoleSchema = z.enum([
  'chord_tone',
  'passing_tone',
  'neighbor_tone',
  'suspension',
  'retardation',
  'anticipation',
  'appoggiatura',
  'escape_tone',
  'pedal_tone',
  'unclassified',
  'ambiguous',
]);

const MelodyInterpretationSchema: z.ZodType<MelodyInterpretation> = z.strictObject({
  melodyEventId: z.string().min(1),
  harmonyEventIds: z.array(z.string().min(1)),
  role: MelodyRoleSchema,
  preparationEventId: z.string().optional(),
  resolutionEventId: z.string().optional(),
  suspensionType: z.enum(['4-3', '7-6', '9-8', '2-3', 'other']).optional(),
  explanation: z.string().min(1),
  evidence: z.array(AnalysisEvidenceSchema),
});

const CandidateProvenanceSchema: z.ZodType<CandidateProvenance> = z.strictObject({
  generatorId: z.string().min(1),
  generatorVersion: z.string().min(1),
  knowledgePackIds: z.array(z.string().min(1)),
  generatedAt: z.string().optional(),
  fixtureAuthored: z.boolean(),
});

const EffectDimensionSchema = z.enum([
  'closure_strength',
  'forward_motion',
  'stability',
  'tension',
  'brightness',
  'voice_leading_ease',
  'melodic_fit',
  'style_fit',
  'congregational_singability',
]);

const EffectDescriptorSchema: z.ZodType<EffectDescriptor> = z.strictObject({
  id: z.string().min(1),
  dimension: EffectDimensionSchema,
  value: z.number().optional(),
  label: z.string().min(1),
  explanation: z.string().min(1),
  evidenceIds: z.array(z.string().min(1)),
  source: z.union([EvidenceSourceSchema, z.literal('hybrid')]),
  overrideOf: z.string().optional(),
});

const RankingDimensionsSchema: z.ZodType<RankingDimensions> = z.strictObject({
  intentMatch: z.number().optional(),
  melodicFit: z.number().optional(),
  voiceLeadingEase: z.number().optional(),
  styleFit: z.number().optional(),
  closureStrength: z.number().optional(),
  forwardMotion: z.number().optional(),
  novelty: z.number().optional(),
  confidence: z.number().optional(),
});

export const PhraseIntentSchema = z.enum(['continue', 'build', 'approach_cadence', 'close']);

const DerivabilityNoteSchema: z.ZodType<DerivabilityNote> = z.strictObject({
  aspect: z.enum(['chord_path', 'voicing', 'ranking', 'interpretation', 'effects']),
  status: z.enum(['computed', 'needs_math', 'needs_data', 'unsure']),
  note: z.string().min(1),
});

/**
 * What a mid-hymn snippet arrives from (domain/approach.ts). The voices map is
 * spelled out with optional members rather than a record: an enum-keyed
 * z.record is EXHAUSTIVE, so a seam that knows only the chord (voices: {})
 * would fail to parse and take a saved project down with it.
 */
const ApproachVoiceSchema = z.strictObject({
  pitch: SpelledPitchSchema,
  scaleDegree: ScaleDegreePitchSchema,
});

const ApproachContextSchema: z.ZodType<ApproachContext> = z.strictObject({
  harmony: HarmonyEventSchema.nullable(),
  voices: z.strictObject({
    soprano: ApproachVoiceSchema.optional(),
    alto: ApproachVoiceSchema.optional(),
    tenor: ApproachVoiceSchema.optional(),
    bass: ApproachVoiceSchema.optional(),
  }),
});

export const CandidatePathSchema: z.ZodType<CandidatePath> = z.strictObject({
  id: z.string().min(1),
  fixtureId: z.string().optional(),
  title: z.string().min(1),
  summary: z.string().min(1),
  tonalContext: TonalContextSchema,
  phraseIntent: PhraseIntentSchema,
  harmonyEvents: z.array(HarmonyEventSchema).min(1),
  voicing: SATBVoicingSchema,
  melodyInterpretations: z.array(MelodyInterpretationSchema),
  descriptors: z.array(EffectDescriptorSchema),
  evidence: z.array(AnalysisEvidenceSchema),
  rank: z.number().optional(),
  rankingDimensions: RankingDimensionsSchema.optional(),
  provenance: CandidateProvenanceSchema,
  compatibilityTags: z.array(z.string()).optional(),
  derivability: z.array(DerivabilityNoteSchema).optional(),
  approach: ApproachContextSchema.optional(),
});

export const AcceptedContextSchema: z.ZodType<AcceptedContext> = z.strictObject({
  previousHarmony: HarmonyEventSchema.nullable(),
  previousVoicing: SATBVoicingSchema.nullable(),
});

const TonalContextMatchSchema: z.ZodType<TonalContextMatch> = z.strictObject({
  tonicPitchClass: PitchClassNumberSchema,
  mode: ModeIdSchema,
});

const FixtureMatchCriteriaSchema: z.ZodType<FixtureMatchCriteria> = z.strictObject({
  tonalContext: TonalContextMatchSchema,
  melodySignature: z.string().min(1),
  phraseIntent: PhraseIntentSchema.optional(),
  acceptedHarmonySignature: z.string().optional(),
});

const FixtureInitialStateSchema: z.ZodType<FixtureInitialState> = z.strictObject({
  tonalContext: TonalContextSchema,
  phraseIntent: PhraseIntentSchema,
  tempoBpm: z.number().positive(),
  acceptedContext: AcceptedContextSchema,
  fragment: MelodyFragmentSchema,
  boundaryConstraints: z.array(BoundaryConstraintSchema),
});

const FixtureCandidateSetSchema: z.ZodType<FixtureCandidateSet> = z.strictObject({
  id: z.string().min(1),
  lockSignature: z.string().optional(),
  candidates: z.array(CandidatePathSchema),
});

const HarmonizationFixtureSchema: z.ZodType<HarmonizationFixture> = z.strictObject({
  id: z.string().min(1),
  name: z.string().min(1),
  match: FixtureMatchCriteriaSchema,
  initialState: FixtureInitialStateSchema,
  candidateSets: z.array(FixtureCandidateSetSchema).min(1),
});

export function parseHarmonizationFixture(data: unknown): HarmonizationFixture {
  return HarmonizationFixtureSchema.parse(data);
}
