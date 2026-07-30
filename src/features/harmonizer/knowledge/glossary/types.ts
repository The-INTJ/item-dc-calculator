/**
 * Glossary term types — the data contract for the workbench's teaching layer.
 *
 * Terms are tiered so definitions never explain a word with a harder word:
 * `core` terms are plain English (no markup at all), `analysis` terms may lean
 * on core terms plus a small set of analysis helpers, and `advanced` terms may
 * lean on anything below them. The tier discipline is enforced by
 * glossary.test.ts, not by convention.
 */

export type GlossaryTier = 'core' | 'analysis' | 'advanced';

export interface GlossaryTerm {
  id: string;
  /** The inline display form, e.g. 'passing tone' for id 'passing-tone'. */
  display: string;
  /** Plural/inflected forms that also mean this term (for future auto-linking). */
  matches?: string[];
  tier: GlossaryTier;
  /**
   * 1–2 sentences, "what + why", written for a singing-school student who
   * knows do-re-mi but not roman numerals. Words in square brackets are
   * nested term links: `[term-id]` or `[Display text|term-id]`.
   */
  definition: string;
  seeAlso?: string[];
  /** Tradition/usage aside shown under the definition (e.g. the si/ti note). */
  note?: string;
}
