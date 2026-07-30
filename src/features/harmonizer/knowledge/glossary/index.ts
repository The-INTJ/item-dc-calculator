/**
 * The glossary — assembled term registry plus the typed mapping tables that
 * let components attach terms to musical data WITHOUT hardcoding term ids
 * next to musical values (the house rule: components render typed data).
 */

import type { MelodyRole } from '../../domain/analysis-types';
import type { ChordQuality, VoiceId } from '../../domain/music-types';
import { advancedTerms } from './terms-advanced';
import { analysisTerms } from './terms-analysis';
import { coreTerms } from './terms-core';
import type { GlossaryTerm, GlossaryTier } from './types';

export type { GlossaryTerm, GlossaryTier } from './types';

export const glossaryTerms = {
  ...coreTerms,
  ...analysisTerms,
  ...advancedTerms,
} as const satisfies Record<string, GlossaryTerm>;

export type TermId = keyof typeof glossaryTerms;

export function isTermId(id: string): id is TermId {
  return Object.prototype.hasOwnProperty.call(glossaryTerms, id);
}

/** Build a marked-text token: '[display|id]' or '[id]'. Typo-safe via TermId. */
export function term(id: TermId, display?: string): string {
  return display ? `[${display}|${id}]` : `[${id}]`;
}

const TIER_ORDER: GlossaryTier[] = ['core', 'analysis', 'advanced'];

/** Terms grouped by tier in teaching order — drives the Help panel. */
export function listTermsByTier(): Array<{ tier: GlossaryTier; terms: GlossaryTerm[] }> {
  return TIER_ORDER.map((tier) => ({
    tier,
    terms: Object.values(glossaryTerms).filter((entry) => entry.tier === tier),
  }));
}

/* ---------- mapping tables (typed data → term) ---------- */

/**
 * Melody-role → glossary term. `unclassified` and `ambiguous` are honest
 * non-claims, so they carry no term and render plain.
 */
export const roleTermIds: Record<MelodyRole, TermId | null> = {
  chord_tone: 'chord-tone',
  passing_tone: 'passing-tone',
  neighbor_tone: 'neighbor-tone',
  suspension: 'suspension',
  retardation: 'retardation',
  anticipation: 'anticipation',
  appoggiatura: 'appoggiatura',
  escape_tone: 'escape-tone',
  pedal_tone: 'pedal-point',
  unclassified: null,
  ambiguous: null,
};

export const voiceTermIds: Record<VoiceId, TermId> = {
  soprano: 'soprano',
  alto: 'alto',
  tenor: 'tenor',
  bass: 'bass',
};

export const solfegeTermId: TermId = 'solfege';
export const numeralTermId: TermId = 'roman-numeral';
export const inversionTermId: TermId = 'inversion';

/**
 * Chord-quality → glossary term. Triad qualities read as [triad], sevenths as
 * [seventh-chord]. Suspended chords are NOT suspensions (the non-chord-tone
 * figure) — they get the generic [chord], as does 'other'.
 */
export const qualityTermIds: Record<ChordQuality, TermId> = {
  major: 'triad',
  minor: 'triad',
  diminished: 'triad',
  augmented: 'triad',
  dominant_seventh: 'seventh-chord',
  major_seventh: 'seventh-chord',
  minor_seventh: 'seventh-chord',
  half_diminished_seventh: 'seventh-chord',
  fully_diminished_seventh: 'seventh-chord',
  suspended_second: 'chord',
  suspended_fourth: 'chord',
  other: 'chord',
};

/**
 * Terms allowed to stand alone (no inbound reference from a definition,
 * seeAlso, or mapping table). Currently every term is cross-referenced; add a
 * TermId here only when a genuinely standalone entry earns its place.
 */
export const STANDALONE_TERM_IDS: readonly TermId[] = [];
