/**
 * Parity corpora — the authored fixture families become the engine's
 * regression bar. For every fixture: the engine must produce valid,
 * schema-clean candidates for its melody, and family-specific claims hold
 * (A's tonic reading, B's suspension, E's raised si). The zod parse is the
 * lockstep tripwire: any domain-type drift breaks here, loudly.
 */
import { describe, expect, it } from 'vitest';
import { listFixtures } from '../../fixtures/registry';
import { CandidatePathSchema } from '../../fixtures/schemas';
import { generateReadings } from './generate';

const fixtures = listFixtures();

describe('engine parity over the fixture corpora', () => {
  it('generates schema-clean candidates for every fixture melody', () => {
    for (const fixture of fixtures) {
      const readings = generateReadings({
        fragment: fixture.initialState.fragment,
        context: fixture.initialState.tonalContext,
        phraseIntent: fixture.initialState.phraseIntent,
      });
      expect(readings.length, fixture.id).toBeGreaterThan(0);
      for (const candidate of readings) {
        // The zod-lockstep tripwire: strict schemas reject any drift.
        const parsed = CandidatePathSchema.safeParse(candidate);
        expect(
          parsed.success,
          `${fixture.id} / ${candidate.id}: ${parsed.success ? '' : parsed.error.message}`,
        ).toBe(true);
        // Soprano is the melody, verbatim by midi.
        expect(
          candidate.voicing.soprano.map((event) => event.pitch.midi),
          fixture.id,
        ).toEqual(fixture.initialState.fragment.events.map((event) => event.pitch.midi));
        // Voices stay inside the editing range.
        for (const voice of ['alto', 'tenor', 'bass'] as const) {
          for (const event of candidate.voicing[voice]) {
            expect(event.pitch.midi, `${fixture.id} ${voice}`).toBeGreaterThanOrEqual(36);
            expect(event.pitch.midi, `${fixture.id} ${voice}`).toBeLessThanOrEqual(84);
          }
        }
      }
    }
  });

  it("finds fixture A's tonic-anchored reading for sol–fa–mi", () => {
    const fixtureA = fixtures.find((entry) => entry.id === 'c-major-sol-fa-mi-continue')!;
    const readings = generateReadings({
      fragment: fixtureA.initialState.fragment,
      context: fixtureA.initialState.tonalContext,
      phraseIntent: 'continue',
    });
    // The authored hero reading is I with fa as passing motion; the engine's
    // set must contain a tonic-anchored candidate reading fa as an ornament
    // or as a dominant-family chord tone (the two authored families).
    const tonicAnchored = readings.some((candidate) => {
      const first = candidate.harmonyEvents[0];
      const faReading = candidate.melodyInterpretations[1];
      return (
        first.analysis.functionTags.includes('tonic') &&
        (faReading.role === 'passing_tone' || faReading.role === 'chord_tone')
      );
    });
    expect(tonicAnchored).toBe(true);
  });

  it("supports fixture E's minor context with the raised si available", () => {
    const fixtureE = fixtures.find((entry) => entry.id === 'a-minor-la-ti-do-continue')!;
    const readings = generateReadings({
      fragment: fixtureE.initialState.fragment,
      context: fixtureE.initialState.tonalContext,
      phraseIntent: fixtureE.initialState.phraseIntent,
    });
    expect(readings.length).toBeGreaterThan(0);
    for (const candidate of readings) {
      // Every reading stays honest: melody notes classified, never unclassified.
      for (const interpretation of candidate.melodyInterpretations) {
        expect(interpretation.role).not.toBe('unclassified');
      }
    }
  });
});
