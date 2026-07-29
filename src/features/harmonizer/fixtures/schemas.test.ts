import { describe, expect, it } from 'vitest';
import { cMajorSolFaMiContinue } from './c-major-sol-fa-mi-continue';
import { parseHarmonizationFixture } from './schemas';

function cloneFixture() {
  return structuredClone(cMajorSolFaMiContinue);
}

describe('fixture schemas', () => {
  it('parses the authored fixture', () => {
    const parsed = parseHarmonizationFixture(cMajorSolFaMiContinue);
    expect(parsed.id).toBe('c-major-sol-fa-mi-continue');
    expect(parsed.candidateSets[0].candidates).toHaveLength(3);
  });

  it('rejects unknown keys (strict objects)', () => {
    const broken: Record<string, unknown> = { ...cloneFixture(), unexpected: true };
    expect(() => parseHarmonizationFixture(broken)).toThrow();
  });

  it('rejects an out-of-range pitch class', () => {
    const broken = cloneFixture();
    broken.initialState.fragment.events[0].pitch.pitchClass = 12;
    expect(() => parseHarmonizationFixture(broken)).toThrow();
  });

  it('rejects midi values inconsistent with the spelling', () => {
    const broken = cloneFixture();
    broken.initialState.fragment.events[0].pitch.midi += 1;
    expect(() => parseHarmonizationFixture(broken)).toThrow();
  });

  it('rejects an invalid inversion', () => {
    const broken = cloneFixture();
    (broken.initialState.acceptedContext.previousHarmony as { inversion: number }).inversion = 4;
    expect(() => parseHarmonizationFixture(broken)).toThrow();
  });
});
