import { describe, expect, it } from 'vitest';
import { assembleSkeletons } from '../../domain/enumerate';
import { withDerivedAnalysis } from '../../domain/derive-harmony';
import { getDefaultFixture, getFixtureById } from '../../fixtures/registry';
import { isTermId } from '../glossary';
import { parseMarkedText } from '../markup/parse';
import { composeCandidateProse } from './composer';
import {
  cadenceDescriptors,
  chordName,
  composeTemplates,
  stabilityDescriptors,
  styleDescriptors,
  tensionDescriptors,
} from './templates';

const BANNED = /\b(best|correct|illegal|bad)\b|\d+%/i;

function allTemplateSamples(): string[] {
  const name = chordName('sol', 'V', 'G');
  return [
    composeTemplates.chordTone({ syllable: 'mi', chordName: name }),
    composeTemplates.passing({ syllable: 'fa', from: 'sol', to: 'mi', chordName: name, held: true }),
    composeTemplates.passing({ syllable: 'fa', from: 'sol', to: 'mi', chordName: name, held: false }),
    composeTemplates.neighbor({ syllable: 're', from: 'do', to: 'do', chordName: name, held: true }),
    composeTemplates.suspension({
      syllable: 'do',
      to: 'ti',
      chordName: name,
      held: false,
      suspensionFigure: '4-3',
    }),
    composeTemplates.retardation({ syllable: 'ti', to: 'do', chordName: name, held: false }),
    composeTemplates.anticipation({ syllable: 'do', chordName: name, held: false }),
    composeTemplates.appoggiatura({ syllable: 'fa', to: 'mi', chordName: name, held: false }),
    composeTemplates.escape({ syllable: 're', chordName: name, held: false }),
    composeTemplates.pedal({ syllable: 'do', chordName: name, held: false }),
    composeTemplates.ambiguous({ syllable: 'fi', chordName: name }),
    composeTemplates.noChordIdentity({ syllable: 'fa' }),
    ...Object.values(cadenceDescriptors).map((entry) => entry.explanation),
    ...Object.values(stabilityDescriptors).map((entry) => entry.explanation),
    ...Object.values(tensionDescriptors).map((entry) => entry.explanation),
    ...Object.values(styleDescriptors).map((entry) => entry.explanation),
  ];
}

describe('templates', () => {
  it('produce the model passing-tone sentence shape', () => {
    const prose = composeTemplates.passing({
      syllable: 'fa',
      from: 'sol',
      to: 'mi',
      chordName: chordName('do', 'I', 'C'),
      held: true,
    });
    expect(prose).toContain('sol–fa–mi');
    expect(prose).toContain('[passing-tone]');
    expect(prose).toContain('[dissonance]');
    expect(prose).toContain('resolving to mi');
  });

  it('every marked term in every template resolves in the glossary', () => {
    for (const sample of allTemplateSamples()) {
      for (const segment of parseMarkedText(sample)) {
        if (segment.kind === 'term') {
          expect(isTermId(segment.termId), `${segment.termId} in: ${sample}`).toBe(true);
        }
      }
    }
  });

  it('never uses banned judgment words', () => {
    for (const sample of allTemplateSamples()) {
      expect(BANNED.test(sample), sample).toBe(false);
    }
  });

  it('stays within two sentences', () => {
    for (const sample of allTemplateSamples()) {
      const sentences = sample.split(/[.!?](?:\s|$)/).filter((part) => part.trim().length > 0);
      expect(sentences.length, sample).toBeLessThanOrEqual(2);
    }
  });
});

describe('composeCandidateProse', () => {
  const fixture = getDefaultFixture();

  it('fills descriptors and beginner prose on generated candidates', () => {
    const [candidate] = assembleSkeletons(
      fixture.initialState.fragment,
      fixture.initialState.tonalContext,
      'close',
    );
    const composed = composeCandidateProse(candidate);
    expect(composed.descriptors.length).toBeGreaterThan(0);
    expect(
      composed.evidence.some((entry) => entry.providerId === 'explanation-composer'),
    ).toBe(true);
    // Every explanation resolves its glossary terms.
    for (const interpretation of composed.melodyInterpretations) {
      for (const segment of parseMarkedText(interpretation.explanation)) {
        if (segment.kind === 'term') expect(isTermId(segment.termId)).toBe(true);
      }
    }
  });

  it('is idempotent', () => {
    const [candidate] = assembleSkeletons(
      fixture.initialState.fragment,
      fixture.initialState.tonalContext,
      'continue',
    );
    const once = composeCandidateProse(candidate);
    expect(composeCandidateProse(once)).toEqual(once);
  });

  it('leaves authored candidates untouched (curated beats computed)', () => {
    const authored = fixture.candidateSets[0].candidates[0];
    expect(composeCandidateProse(authored)).toBe(authored);
  });

  it("composes the surface's suspension prose from fixture B's facts", () => {
    const fixtureB = getFixtureById('c-major-do-ti-suspension')!;
    const derived = composeCandidateProse(
      withDerivedAnalysis(
        fixtureB.candidateSets[0].candidates[0],
        fixtureB.initialState.fragment,
        fixtureB.initialState.tonalContext,
      ),
    );
    const doReading = derived.melodyInterpretations[0];
    expect(doReading.role).toBe('suspension');
    expect(doReading.explanation).toContain('[suspension]');
    expect(doReading.explanation).toContain('(4-3)');
    // The suspension also surfaces as a tension descriptor.
    expect(derived.descriptors.some((descriptor) => descriptor.dimension === 'tension')).toBe(
      true,
    );
  });
});
