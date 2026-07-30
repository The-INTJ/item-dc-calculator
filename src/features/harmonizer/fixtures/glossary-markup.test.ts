/**
 * The markup sweep: every prose string that can surface in the UI — candidate
 * summaries, interpretation explanations, evidence explanations, descriptor
 * explanations, and the intent descriptions in content.ts — must parse with
 * every bracket reference resolving to a real glossary term. Unknown ids
 * degrade to plain text at runtime, so this test is what keeps authored
 * markup honest.
 */

import { describe, expect, it } from 'vitest';
import { content } from '../content';
import { parseMarkedText } from '../knowledge/markup/parse';
import { listFixtures } from './registry';

interface ProseSite {
  where: string;
  text: string;
}

function collectFixtureProse(): ProseSite[] {
  const sites: ProseSite[] = [];
  for (const fixture of listFixtures()) {
    for (const set of fixture.candidateSets) {
      for (const candidate of set.candidates) {
        const at = `${fixture.id}/${set.id}/${candidate.id}`;
        sites.push({ where: `${at}: summary`, text: candidate.summary });
        for (const interpretation of candidate.melodyInterpretations) {
          sites.push({
            where: `${at}: interpretation ${interpretation.melodyEventId}`,
            text: interpretation.explanation,
          });
          for (const evidence of interpretation.evidence) {
            if (evidence.explanation) {
              sites.push({ where: `${at}: evidence ${evidence.id}`, text: evidence.explanation });
            }
          }
        }
        for (const descriptor of candidate.descriptors) {
          sites.push({ where: `${at}: descriptor ${descriptor.id}`, text: descriptor.explanation });
        }
        for (const evidence of candidate.evidence) {
          if (evidence.explanation) {
            sites.push({ where: `${at}: evidence ${evidence.id}`, text: evidence.explanation });
          }
        }
      }
    }
  }
  return sites;
}

/** Bracket tokens in the raw string — each must come back as a term segment. */
function tokenCount(text: string): number {
  return [...text.matchAll(/\[([^[\]]+)\]/g)].length;
}

describe('glossary markup in authored prose', () => {
  it('every bracket reference in every fixture prose string resolves', () => {
    const sites = collectFixtureProse();
    expect(sites.length).toBeGreaterThan(0);
    for (const site of sites) {
      const parsed = parseMarkedText(site.text);
      const termSegments = parsed.filter((segment) => segment.kind === 'term');
      expect(
        termSegments.length,
        `${site.where} has an unresolved term reference in: ${site.text}`,
      ).toBe(tokenCount(site.text));
    }
  });

  it('the default fixture family actually carries term markup', () => {
    const marked = collectFixtureProse().filter(
      (site) => site.where.startsWith('c-major-sol-fa-mi-continue') && tokenCount(site.text) > 0,
    );
    expect(marked.length).toBeGreaterThan(0);
  });

  it('every bracket reference in the intent descriptions resolves', () => {
    for (const [intent, text] of Object.entries(content.contextBar.intentDescriptions)) {
      const termSegments = parseMarkedText(text).filter((segment) => segment.kind === 'term');
      expect(
        termSegments.length,
        `intentDescriptions.${intent} has an unresolved term reference in: ${text}`,
      ).toBe(tokenCount(text));
    }
  });
});
