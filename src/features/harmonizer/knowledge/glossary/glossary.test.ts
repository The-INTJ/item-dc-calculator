import { describe, expect, it } from 'vitest';
import type { MelodyRole } from '../../domain/analysis-types';
import {
  glossaryTerms,
  inversionTermId,
  isTermId,
  numeralTermId,
  qualityTermIds,
  roleTermIds,
  solfegeTermId,
  STANDALONE_TERM_IDS,
  term,
  voiceTermIds,
  type GlossaryTerm,
} from './index';

const allTerms: GlossaryTerm[] = Object.values(glossaryTerms);

const TOKEN = /\[([^[\]]+)\]/g;

/** Bracket-referenced term ids in a marked string (custom-display aware). */
function referencedIds(text: string): string[] {
  return [...text.matchAll(TOKEN)].map((match) => {
    const body = match[1];
    const pipe = body.lastIndexOf('|');
    return pipe >= 0 ? body.slice(pipe + 1) : body;
  });
}

const ANALYSIS_HELPER_IDS = new Set([
  'step',
  'half-step',
  'scale-degree',
  'chord-tone',
  'non-chord-tone',
]);

const MELODY_ROLES: MelodyRole[] = [
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
];

describe('glossary terms', () => {
  it('every bracket reference in every definition and note resolves', () => {
    for (const entry of allTerms) {
      for (const id of referencedIds(entry.definition + (entry.note ?? ''))) {
        expect(isTermId(id), `"${entry.id}" references unknown term "${id}"`).toBe(true);
      }
    }
  });

  it('every seeAlso reference resolves', () => {
    for (const entry of allTerms) {
      for (const id of entry.seeAlso ?? []) {
        expect(isTermId(id), `"${entry.id}" seeAlso references unknown term "${id}"`).toBe(true);
      }
    }
  });

  it('core definitions contain zero bracket markup', () => {
    for (const entry of allTerms.filter((candidate) => candidate.tier === 'core')) {
      expect(
        referencedIds(entry.definition),
        `core term "${entry.id}" must be plain English`,
      ).toEqual([]);
    }
  });

  it('analysis definitions reference only core terms and the five analysis helpers', () => {
    for (const entry of allTerms.filter((candidate) => candidate.tier === 'analysis')) {
      for (const id of referencedIds(entry.definition)) {
        if (!isTermId(id)) continue; // covered by the resolution test
        const target = glossaryTerms[id] as GlossaryTerm;
        const allowed = target.tier === 'core' || ANALYSIS_HELPER_IDS.has(id);
        expect(
          allowed,
          `analysis term "${entry.id}" references "${id}" (${target.tier}), which is not core or a helper`,
        ).toBe(true);
      }
    }
  });

  it('advanced definitions reference only core and analysis terms', () => {
    for (const entry of allTerms.filter((candidate) => candidate.tier === 'advanced')) {
      for (const id of referencedIds(entry.definition)) {
        if (!isTermId(id)) continue;
        const target = glossaryTerms[id] as GlossaryTerm;
        expect(
          target.tier !== 'advanced',
          `advanced term "${entry.id}" references advanced term "${id}"`,
        ).toBe(true);
      }
    }
  });

  it('no definition or note uses judgment words', () => {
    const banned = /\b(best|correct|illegal|bad|percentages?)\b/i;
    for (const entry of allTerms) {
      const text = `${entry.definition} ${entry.note ?? ''}`;
      expect(banned.test(text), `"${entry.id}" uses a banned word: ${text}`).toBe(false);
    }
  });

  it('solfege and leading-tone carry the seven-shape si/ti tradition note', () => {
    for (const id of ['solfege', 'leading-tone'] as const) {
      const entry = glossaryTerms[id] as GlossaryTerm;
      expect(entry.note, `"${id}" is missing its tradition note`).toBeTruthy();
      expect(entry.note).toContain('si for the seventh degree');
      expect(entry.note).toContain('writes ti');
    }
  });

  it('open-fifth is described neutrally and plagal-cadence names the Amen ending', () => {
    const openFifth = glossaryTerms['open-fifth'] as GlossaryTerm;
    expect(/\b(error|mistake|wrong|avoid)\b/i.test(openFifth.definition)).toBe(false);
    expect((glossaryTerms['plagal-cadence'] as GlossaryTerm).definition).toContain('Amen');
  });

  it('every term offers matches for inflected forms', () => {
    for (const entry of allTerms) {
      expect(entry.matches?.length ?? 0, `"${entry.id}" has no matches`).toBeGreaterThan(0);
    }
  });

  it('roleTermIds covers every MelodyRole and resolves', () => {
    expect(Object.keys(roleTermIds).sort()).toEqual([...MELODY_ROLES].sort());
    for (const [role, id] of Object.entries(roleTermIds)) {
      if (id === null) continue;
      expect(isTermId(id), `role "${role}" maps to unknown term "${id}"`).toBe(true);
    }
    expect(roleTermIds.unclassified).toBeNull();
    expect(roleTermIds.ambiguous).toBeNull();
  });

  it('the other mapping tables resolve', () => {
    for (const id of Object.values(voiceTermIds)) expect(isTermId(id)).toBe(true);
    for (const id of Object.values(qualityTermIds)) expect(isTermId(id)).toBe(true);
    expect(isTermId(solfegeTermId)).toBe(true);
    expect(isTermId(numeralTermId)).toBe(true);
    expect(isTermId(inversionTermId)).toBe(true);
    // Suspended chords are chords, never the suspension figure.
    expect(qualityTermIds.suspended_second).toBe('chord');
    expect(qualityTermIds.suspended_fourth).toBe('chord');
  });

  it('every term is reachable (definition, seeAlso, mapping table, or allowlist)', () => {
    const reachable = new Set<string>(STANDALONE_TERM_IDS);
    for (const entry of allTerms) {
      for (const id of referencedIds(entry.definition + (entry.note ?? ''))) {
        if (id !== entry.id) reachable.add(id);
      }
      for (const id of entry.seeAlso ?? []) {
        if (id !== entry.id) reachable.add(id);
      }
    }
    for (const id of Object.values(roleTermIds)) if (id !== null) reachable.add(id);
    for (const id of Object.values(voiceTermIds)) reachable.add(id);
    for (const id of Object.values(qualityTermIds)) reachable.add(id);
    reachable.add(solfegeTermId);
    reachable.add(numeralTermId);
    reachable.add(inversionTermId);

    for (const entry of allTerms) {
      expect(reachable.has(entry.id), `term "${entry.id}" is unreachable`).toBe(true);
    }
  });

  it('term() builds bracket markup', () => {
    expect(term('tonic')).toBe('[tonic]');
    expect(term('cadence', 'cadences')).toBe('[cadences|cadence]');
  });

  it('ids are self-consistent and displays are non-empty', () => {
    for (const [key, entry] of Object.entries(glossaryTerms)) {
      expect(entry.id).toBe(key);
      expect(entry.display.length).toBeGreaterThan(0);
      expect(entry.definition.length).toBeGreaterThan(0);
    }
  });
});
