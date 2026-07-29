import { describe, expect, it } from 'vitest';
import { parseLockSignature } from '../domain/lock-signature';
import { acceptedHarmonySignature, melodySignature } from '../domain/signatures';
import { toTimelineSpan, totalUnits } from '../domain/timing';
import {
  DEFAULT_FIXTURE_ID,
  getDefaultFixture,
  getFixtureById,
  listFixtures,
  listTonalContexts,
} from './registry';

const fixtures = listFixtures();

describe('fixture registry integrity (all fixtures × all candidate sets)', () => {
  it('registers, validates, and lists', () => {
    expect(getDefaultFixture().id).toBe(DEFAULT_FIXTURE_ID);
    expect(getFixtureById('nope')).toBeNull();
    expect(fixtures.length).toBeGreaterThanOrEqual(2);
    const contexts = listTonalContexts();
    expect(contexts.some((context) => context.mode === 'major')).toBe(true);
  });

  for (const fixture of fixtures) {
    describe(fixture.id, () => {
      const fragmentUnits = totalUnits(fixture.initialState.fragment);
      const melodyMidis = fixture.initialState.fragment.events.map((event) => event.pitch.midi);

      it('stores match signatures equal to its own computed signatures', () => {
        expect(fixture.match.melodySignature).toBe(
          melodySignature(fixture.initialState.fragment.events),
        );
        if (fixture.match.acceptedHarmonySignature !== undefined) {
          expect(fixture.match.acceptedHarmonySignature).toBe(
            acceptedHarmonySignature(fixture.initialState.acceptedContext.previousHarmony),
          );
        }
      });

      for (const set of fixture.candidateSets) {
        describe(`set ${set.id}`, () => {
          it('candidates are authored with soprano ≡ melody and in-bounds voices', () => {
            expect(set.candidates.length).toBeGreaterThan(0);
            for (const candidate of set.candidates) {
              expect(candidate.provenance.fixtureAuthored).toBe(true);
              expect(candidate.voicing.soprano.map((event) => event.pitch.midi)).toEqual(
                melodyMidis,
              );
              for (const events of [
                candidate.voicing.soprano,
                candidate.voicing.alto,
                candidate.voicing.tenor,
                candidate.voicing.bass,
              ]) {
                const spans = events
                  .map((event) => toTimelineSpan(event.start, event.duration))
                  .sort((a, b) => a.startUnit - b.startUnit);
                for (let index = 0; index < spans.length; index += 1) {
                  expect(spans[index].startUnit).toBeGreaterThanOrEqual(1);
                  expect(
                    spans[index].startUnit - 1 + spans[index].spanUnits,
                  ).toBeLessThanOrEqual(fragmentUnits);
                  if (index > 0) {
                    expect(spans[index].startUnit).toBeGreaterThanOrEqual(
                      spans[index - 1].startUnit + spans[index - 1].spanUnits,
                    );
                  }
                }
              }
            }
          });

          it('harmony tiles the fragment and respects hold boundaries', () => {
            const events = fixture.initialState.fragment.events;
            const holdStartUnits = fixture.initialState.boundaryConstraints
              .filter((constraint) => constraint.policy === 'hold')
              .map((constraint) => {
                const event = events.find(
                  (melody) => melody.id === constraint.afterMelodyEventId,
                );
                if (!event) throw new Error('boundary references an unknown melody event');
                const span = toTimelineSpan(event.start, event.duration);
                return span.startUnit + span.spanUnits;
              });
            for (const candidate of set.candidates) {
              const spans = candidate.harmonyEvents.map((event) =>
                toTimelineSpan(event.start, event.duration),
              );
              expect(spans[0].startUnit).toBe(1);
              expect(spans.reduce((sum, span) => sum + span.spanUnits, 0)).toBe(fragmentUnits);
              for (let index = 1; index < spans.length; index += 1) {
                expect(spans[index].startUnit).toBe(
                  spans[index - 1].startUnit + spans[index - 1].spanUnits,
                );
              }
              const changeUnits = spans.slice(1).map((span) => span.startUnit);
              for (const holdUnit of holdStartUnits) {
                expect(changeUnits).not.toContain(holdUnit);
              }
            }
          });

          it('evidence references resolve and interpretations point at real events', () => {
            const melodyIds = new Set(
              fixture.initialState.fragment.events.map((event) => event.id),
            );
            for (const candidate of set.candidates) {
              const evidenceIds = new Set(candidate.evidence.map((evidence) => evidence.id));
              for (const descriptor of candidate.descriptors) {
                for (const evidenceId of descriptor.evidenceIds) {
                  expect(evidenceIds.has(evidenceId)).toBe(true);
                }
              }
              const harmonyIds = new Set(candidate.harmonyEvents.map((event) => event.id));
              expect(candidate.melodyInterpretations).toHaveLength(melodyIds.size);
              for (const interpretation of candidate.melodyInterpretations) {
                expect(melodyIds.has(interpretation.melodyEventId)).toBe(true);
                for (const harmonyEventId of interpretation.harmonyEventIds) {
                  expect(harmonyIds.has(harmonyEventId)).toBe(true);
                }
              }
            }
          });

          if (set.lockSignature !== undefined) {
            it('every candidate satisfies the authored lock signature', () => {
              const entries = parseLockSignature(set.lockSignature ?? '');
              expect(entries.length).toBeGreaterThan(0);
              for (const candidate of set.candidates) {
                for (const entry of entries) {
                  const found = candidate.voicing[entry.voice].find((event) => {
                    const span = toTimelineSpan(event.start, event.duration);
                    return (
                      span.startUnit - 1 === entry.startUnit &&
                      span.spanUnits === entry.units &&
                      event.pitch.midi === entry.pitch.midi
                    );
                  });
                  expect(found).toBeTruthy();
                }
              }
            });
          }
        });
      }
    });
  }

  it('fixture D shares fixture A’s rhythm — the hero demo stays arrow-reachable', () => {
    const rhythm = (id: string) =>
      getFixtureById(id)?.initialState.fragment.events.map((event) => {
        const span = toTimelineSpan(event.start, event.duration);
        return `${span.startUnit}:${span.spanUnits}`;
      });
    expect(rhythm('c-major-mi-fa-sol-build')).toEqual(rhythm('c-major-sol-fa-mi-continue'));
  });
});
