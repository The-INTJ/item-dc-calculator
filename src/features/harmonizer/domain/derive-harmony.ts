/**
 * Derive harmony FROM the sounding notes — the SATB surface is the source of
 * truth. Drew's rule: an edit to one note never moves another note; the notes
 * drive the analysis. The melody is not a chord assigner — the whole SATB is
 * the surface we generate around.
 *
 * The heavy lifting lives in domain/engine/annotate.ts (segmentation with
 * ornamental merging, the chord-naming ladder, key-relative readings,
 * non-chord-tone classification that reaches across the approach seam, and
 * voice-leading facts). This module is the surface-facing wrapper: it wires
 * the annotator to a candidate and flips provenance/derivability. Root
 * preference: the bass note first — so A/C/E/G reads Am7, not C6. Naming a
 * sonority is pure math; whether it WORKS is judgment this layer never fakes.
 */

import type { CandidatePath, DerivabilityNote } from './analysis-types';
import type {
  HarmonyEvent,
  MelodyFragment,
  SATBVoicing,
  TonalContext,
} from './music-types';
import { annotateVoicing } from './engine/annotate';

export const USER_GENERATOR_ID = 'user-surface';
const GENERATOR_VERSION = '1.0.0';

/**
 * The chord strip of a working reading, computed from its own notes. Never
 * moves a note; only says what the notes currently form.
 */
export function deriveHarmonyFromVoicing(
  voicing: SATBVoicing,
  context: TonalContext,
  idPrefix: string,
): HarmonyEvent[] {
  return annotateVoicing(voicing, { id: idPrefix, events: [] }, context, null, idPrefix)
    .harmonyEvents;
}

export const USER_EDIT_DERIVABILITY_NOTES: DerivabilityNote[] = [
  {
    aspect: 'chord_path',
    status: 'computed',
    note: 'Chords are named from the sounding notes — pure math. Incomplete shapes are named for what they are (open fifth, missing fifth); spans that form no known shape show ? with the notes.',
  },
  {
    aspect: 'voicing',
    status: 'computed',
    note: 'The voicing is yours; an edit never moves another note.',
  },
  {
    aspect: 'ranking',
    status: 'computed',
    note: 'Voice-leading facts (parallels, spacing, ranges, tendency tones) are computed; how much each one matters is the style pack’s call — observations, never errors.',
  },
  {
    aspect: 'interpretation',
    status: 'computed',
    note: 'Passing tones, neighbor tones, and suspensions are classified by rule; readings that fit no rule cleanly say so honestly.',
  },
  {
    aspect: 'effects',
    status: 'needs_data',
    note: 'Feel and effect labels are curated content; nothing to compute here.',
  },
];

/**
 * Refresh a working reading's analysis from its own notes after an edit (or
 * key change). The notes are untouched; harmony, interpretations, facts,
 * provenance, and derivability flip to the derived-from-surface form.
 * Deterministic — safe inside the reducer.
 */
export function withDerivedAnalysis(
  candidate: CandidatePath,
  fragment: MelodyFragment,
  context: TonalContext,
): CandidatePath {
  const annotation = annotateVoicing(
    candidate.voicing,
    fragment,
    context,
    candidate.approach ?? null,
    candidate.id,
  );
  const alreadyDerived = candidate.provenance.generatorId === USER_GENERATOR_ID;
  return {
    ...candidate,
    tonalContext: context,
    harmonyEvents: annotation.harmonyEvents,
    melodyInterpretations: annotation.melodyInterpretations,
    summary: alreadyDerived
      ? candidate.summary
      : 'Your working reading — the notes are the source of truth; chords are identified from what sounds.',
    // Always wiped: the composer refills them from the fresh facts, so stale
    // prose can never outlive the notes it described.
    descriptors: [],
    evidence: [
      {
        id: `${candidate.id}-ev-derived`,
        source: 'computed',
        featureId: 'analysis_rederived',
        value: true,
        explanation:
          'Analysis re-derived from the sounding notes — the notes drive the chords, never the reverse.',
        providerId: USER_GENERATOR_ID,
        providerVersion: GENERATOR_VERSION,
      },
      ...annotation.evidence,
    ],
    provenance: {
      generatorId: USER_GENERATOR_ID,
      generatorVersion: GENERATOR_VERSION,
      knowledgePackIds: [],
      fixtureAuthored: false,
    },
    derivability: USER_EDIT_DERIVABILITY_NOTES,
  };
}
