/**
 * The ExplanationComposer — the pure pass that turns a computed candidate's
 * facts into glossary-marked beginner prose (spec §19.1's compose stage,
 * synchronous like everything else in the reducer's reach).
 *
 * Scope discipline: it composes ONLY for computed candidates (the engine
 * generator and the user surface). Fixture-authored candidates keep their
 * curated prose untouched — the §19.4 override path runs the other way
 * (curated replaces computed, never computed replaces curated). Deterministic
 * and idempotent: composing twice yields the same candidate.
 */

import type {
  AnalysisEvidence,
  CandidatePath,
  EffectDescriptor,
  MelodyInterpretation,
} from '../../domain/analysis-types';
import { ENGINE_GENERATOR_ID } from '../../domain/engine/generate';
import { USER_GENERATOR_ID } from '../../domain/derive-harmony';
import type { HarmonyEvent } from '../../domain/music-types';
import {
  cadenceDescriptors,
  chordName,
  composeTemplates,
  stabilityDescriptors,
  styleDescriptors,
  tensionDescriptors,
  type CadenceKind,
} from './templates';

export const COMPOSER_PROVIDER_ID = 'explanation-composer';
export const COMPOSER_VERSION = '1.0.0';

const COMPOSABLE_GENERATORS = new Set([ENGINE_GENERATOR_ID, USER_GENERATOR_ID]);

function nameOf(harmony: HarmonyEvent): string {
  return chordName(
    harmony.analysis.scaleDegreeRoot.syllable,
    harmony.analysis.romanNumeral,
    harmony.displaySymbol,
  );
}

function composeInterpretation(
  interpretation: MelodyInterpretation,
  index: number,
  candidate: CandidatePath,
): MelodyInterpretation {
  const soprano = candidate.voicing.soprano;
  if (soprano.length !== candidate.melodyInterpretations.length) return interpretation;
  const event = soprano[index];
  const syllable = event.scaleDegree.syllable;
  const from = soprano[index - 1]?.scaleDegree.syllable;
  const to = soprano[index + 1]?.scaleDegree.syllable;
  const covering = candidate.harmonyEvents.find(
    (harmony) => harmony.id === interpretation.harmonyEventIds[0],
  );
  const clashing =
    interpretation.harmonyEventIds.length > 1
      ? candidate.harmonyEvents.find(
          (harmony) => harmony.id === interpretation.harmonyEventIds[1],
        )
      : undefined;
  if (!covering) return interpretation;

  const heldName = nameOf(covering);
  const params = {
    syllable,
    from,
    to,
    chordName: nameOf(clashing ?? covering),
    held: candidate.harmonyEvents.length === 1,
    suspensionFigure: interpretation.suspensionType,
  };

  let explanation: string | null = null;
  switch (interpretation.role) {
    case 'chord_tone':
      explanation = composeTemplates.chordTone({ syllable, chordName: heldName });
      break;
    case 'passing_tone':
      explanation = composeTemplates.passing({ ...params, chordName: heldName });
      break;
    case 'neighbor_tone':
      explanation = composeTemplates.neighbor({ ...params, chordName: heldName });
      break;
    case 'suspension':
      explanation = composeTemplates.suspension(params);
      break;
    case 'retardation':
      explanation = composeTemplates.retardation(params);
      break;
    case 'anticipation':
      explanation = composeTemplates.anticipation(params);
      break;
    case 'appoggiatura':
      explanation = composeTemplates.appoggiatura(params);
      break;
    case 'escape_tone':
      explanation = composeTemplates.escape(params);
      break;
    case 'pedal_tone':
      explanation = composeTemplates.pedal(params);
      break;
    case 'ambiguous':
      explanation = composeTemplates.ambiguous({ syllable, chordName: heldName });
      break;
    case 'unclassified':
      explanation = composeTemplates.noChordIdentity({ syllable });
      break;
  }
  return explanation === null ? interpretation : { ...interpretation, explanation };
}

function composeDescriptors(candidate: CandidatePath, composedEvidenceId: string): EffectDescriptor[] {
  const descriptors: EffectDescriptor[] = [];
  const push = (
    slug: string,
    dimension: EffectDescriptor['dimension'],
    entry: { label: string; explanation: string },
    evidenceIds: string[],
  ) => {
    descriptors.push({
      id: `${candidate.id}-fx-${slug}`,
      dimension,
      label: entry.label,
      explanation: entry.explanation,
      evidenceIds: [...evidenceIds, composedEvidenceId],
      source: 'rule',
    });
  };

  const cadenceEvidence = candidate.evidence.find(
    (entry) =>
      entry.featureId === 'cadence_reading' &&
      typeof entry.value === 'string' &&
      entry.value in cadenceDescriptors,
  );
  if (cadenceEvidence) {
    const kind = cadenceEvidence.value as CadenceKind;
    push('cadence', 'closure_strength', cadenceDescriptors[kind], [cadenceEvidence.id]);
  }

  const suspensionInterpretation = candidate.melodyInterpretations.find(
    (interpretation) => interpretation.role === 'suspension',
  );
  if (suspensionInterpretation) {
    push('tension', 'tension', tensionDescriptors.heldBreath, [
      ...suspensionInterpretation.evidence.slice(0, 1).map((entry) => entry.id),
    ]);
  }

  const tagSets = candidate.harmonyEvents.map((harmony) => harmony.analysis.functionTags);
  if (tagSets.length > 0 && !cadenceEvidence) {
    const allTonic = tagSets.every((tags) => tags.includes('tonic'));
    const anyDominant = tagSets.some((tags) => tags.includes('dominant'));
    if (allTonic) {
      push('stability', 'stability', stabilityDescriptors.grounded, []);
    } else if (anyDominant) {
      push('stability', 'forward_motion', stabilityDescriptors.keepsMoving, []);
    }
  }

  if (candidate.harmonyEvents.some((harmony) => /\d*5$/.test(harmony.displaySymbol) && harmony.chord.quality === 'other')) {
    push('style', 'style_fit', styleDescriptors.openSound, []);
  }

  return descriptors.slice(0, 3);
}

/**
 * Compose prose for a computed candidate; authored candidates pass through
 * untouched. Replaces melody-interpretation explanations, fills descriptors,
 * and stamps one composer-provenance evidence entry.
 */
export function composeCandidateProse(candidate: CandidatePath): CandidatePath {
  if (!COMPOSABLE_GENERATORS.has(candidate.provenance.generatorId)) return candidate;

  const composedEvidenceId = `${candidate.id}-ev-composed`;
  const melodyInterpretations = candidate.melodyInterpretations.map(
    (interpretation, index) => composeInterpretation(interpretation, index, candidate),
  );
  const withProse: CandidatePath = { ...candidate, melodyInterpretations };
  const descriptors = composeDescriptors(withProse, composedEvidenceId);

  const provenanceEntry: AnalysisEvidence = {
    id: composedEvidenceId,
    source: 'rule',
    featureId: 'explanation_template',
    value: descriptors.map((descriptor) => descriptor.id.split('-fx-')[1] ?? '').filter(Boolean),
    explanation: 'Prose composed from the computed facts by the explanation templates.',
    providerId: COMPOSER_PROVIDER_ID,
    providerVersion: COMPOSER_VERSION,
  };

  return {
    ...withProse,
    descriptors,
    evidence: [
      ...candidate.evidence.filter((entry) => entry.id !== composedEvidenceId),
      provenanceEntry,
    ],
  };
}
