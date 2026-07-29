/**
 * Read-side helpers. CandidatePathSummary is the §13.1 card contract: a
 * candidate card receives this summary, never the full CandidatePath. All
 * strings are derived from candidate data — no musical values originate here.
 */

import type { CandidatePath, DerivabilityNote } from '../domain/analysis-types';
import type { VoiceEvent } from '../domain/music-types';
import type { WorkbenchState } from '../domain/workbench-state';

export interface CandidatePathSummary {
  id: string;
  title: string;
  /** "I held" | "V7 → I" */
  romanNumeralPath: string;
  /** "C" | "G7 → C" */
  displaySymbolPath: string;
  /** "do — do" (held) | "sol → do" (motion) */
  bassOutline: string;
  summary: string;
  descriptorLabels: string[];
  /** The derivability probe's headline: where this reading came from. */
  source: 'authored' | 'computed';
  derivability: DerivabilityNote[];
}

export function getSelectedCandidate(state: WorkbenchState): CandidatePath | null {
  return (
    state.candidates.find((candidate) => candidate.id === state.selectedCandidateId) ?? null
  );
}

function uniqueConsecutiveSyllables(events: VoiceEvent[]): string[] {
  const syllables: string[] = [];
  for (const event of events) {
    const syllable = event.scaleDegree.syllable;
    if (syllables[syllables.length - 1] !== syllable) {
      syllables.push(syllable);
    }
  }
  return syllables;
}

/** Em dash = held ("do — do"); arrow = motion ("sol → do"). */
function bassOutline(candidate: CandidatePath): string {
  const syllables = uniqueConsecutiveSyllables(candidate.voicing.bass);
  if (syllables.length === 0) return '';
  if (syllables.length === 1) return `${syllables[0]} — ${syllables[0]}`;
  return syllables.join(' → ');
}

function romanNumeralPath(candidate: CandidatePath): string {
  const numerals = candidate.harmonyEvents.map((event) => event.analysis.romanNumeral);
  if (numerals.length === 1) return `${numerals[0]} held`;
  return numerals.join(' → ');
}

function displaySymbolPath(candidate: CandidatePath): string {
  return candidate.harmonyEvents.map((event) => event.displaySymbol).join(' → ');
}

export function toCandidatePathSummary(candidate: CandidatePath): CandidatePathSummary {
  return {
    id: candidate.id,
    title: candidate.title,
    romanNumeralPath: romanNumeralPath(candidate),
    displaySymbolPath: displaySymbolPath(candidate),
    bassOutline: bassOutline(candidate),
    summary: candidate.summary,
    descriptorLabels: candidate.descriptors.map((descriptor) => descriptor.label),
    source: candidate.provenance.fixtureAuthored ? 'authored' : 'computed',
    derivability: candidate.derivability ?? [],
  };
}
