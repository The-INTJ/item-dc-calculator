/**
 * Analysis, evidence, and candidate types — spec §15.10–15.14.
 *
 * Every interpretive claim carries evidence with source + provenance so that
 * computed facts, rule-pack results, corpus statistics, and curated copy can
 * coexist and be told apart. Nothing here attaches universal effects to a
 * chord; descriptors are per-candidate and context-sensitive.
 */

import type { ApproachContext } from './approach';
import type {
  HarmonyEvent,
  PhraseIntent,
  SATBVoicing,
  TonalContext,
} from './music-types';

export type MelodyRole =
  | 'chord_tone'
  | 'passing_tone'
  | 'neighbor_tone'
  | 'suspension'
  | 'retardation'
  | 'anticipation'
  | 'appoggiatura'
  | 'escape_tone'
  | 'pedal_tone'
  | 'unclassified'
  | 'ambiguous';

export type EvidenceSource = 'computed' | 'rule' | 'corpus' | 'curated' | 'user';

export interface AnalysisEvidence {
  id: string;
  source: EvidenceSource;
  featureId: string;
  value: boolean | number | string | string[];
  /** 0–1; never displayed as a goodness score. */
  confidence?: number;
  explanation?: string;
  providerId: string;
  providerVersion: string;
}

export interface MelodyInterpretation {
  melodyEventId: string;
  harmonyEventIds: string[];
  role: MelodyRole;
  preparationEventId?: string;
  resolutionEventId?: string;
  suspensionType?: '4-3' | '7-6' | '9-8' | '2-3' | 'other';
  explanation: string;
  evidence: AnalysisEvidence[];
}

export interface CandidateProvenance {
  generatorId: string;
  generatorVersion: string;
  knowledgePackIds: string[];
  generatedAt?: string;
  fixtureAuthored: boolean;
}

export type EffectDimension =
  | 'closure_strength'
  | 'forward_motion'
  | 'stability'
  | 'tension'
  | 'brightness'
  | 'voice_leading_ease'
  | 'melodic_fit'
  | 'style_fit'
  | 'congregational_singability';

export interface EffectDescriptor {
  id: string;
  dimension: EffectDimension;
  /** Normalized internal value; developer/detail views only, never a score UI. */
  value?: number;
  label: string;
  explanation: string;
  evidenceIds: string[];
  source: EvidenceSource | 'hybrid';
  overrideOf?: string;
}

/** Separate ranking dimensions — never averaged into a universal quality score. */
export interface RankingDimensions {
  intentMatch?: number;
  melodicFit?: number;
  voiceLeadingEase?: number;
  styleFit?: number;
  closureStrength?: number;
  forwardMotion?: number;
  novelty?: number;
  confidence?: number;
}

/**
 * The derivability probe (full-POC amendment): computed skeleton candidates
 * label every aspect of themselves — so the engine-vs-data question is
 * answered by looking at the UI. Authored fixtures omit this field.
 *
 * Statuses: `computed` = the naive layer derived it; `needs_math` = derivable
 * in principle (a fuller engine would), just beyond the naive vocabulary;
 * `needs_data` = needs curated/custom content or judgment; `unsure` = unknown
 * which.
 */
export type DerivabilityAspect =
  | 'chord_path'
  | 'voicing'
  | 'ranking'
  | 'interpretation'
  | 'effects';

export type DerivabilityStatus = 'computed' | 'needs_math' | 'needs_data' | 'unsure';

export interface DerivabilityNote {
  aspect: DerivabilityAspect;
  status: DerivabilityStatus;
  note: string;
}

/** A complete proposed reading of the fragment — harmony, voicing, and interpretation. */
export interface CandidatePath {
  id: string;
  fixtureId?: string;
  title: string;
  summary: string;
  tonalContext: TonalContext;
  phraseIntent: PhraseIntent;
  harmonyEvents: HarmonyEvent[];
  voicing: SATBVoicing;
  melodyInterpretations: MelodyInterpretation[];
  descriptors: EffectDescriptor[];
  evidence: AnalysisEvidence[];
  rank?: number;
  rankingDimensions?: RankingDimensions;
  provenance: CandidateProvenance;
  compatibilityTags?: string[];
  derivability?: DerivabilityNote[];
  /**
   * What this reading arrives from when it sits mid-hymn (see domain/approach.ts).
   * Absent when the snippet opens the piece. Stamped by the state layer, never
   * authored in a fixture.
   */
  approach?: ApproachContext;
}
