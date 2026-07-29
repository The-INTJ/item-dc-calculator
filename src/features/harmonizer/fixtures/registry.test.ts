import { describe, expect, it } from 'vitest';
import {
  acceptedHarmonySignature,
  boundarySignature,
  melodySignature,
} from '../domain/signatures';
import { toTimelineSpan, totalUnits } from '../domain/timing';
import { DEFAULT_FIXTURE_ID, getDefaultFixture, getFixtureById } from './registry';

const fixture = getDefaultFixture();
const candidates = fixture.candidateSets[0].candidates;

describe('fixture registry integrity', () => {
  it('registers and validates the default fixture', () => {
    expect(fixture.id).toBe(DEFAULT_FIXTURE_ID);
    expect(candidates).toHaveLength(3);
    expect(getFixtureById('nope')).toBeNull();
  });

  it('stores match signatures equal to the signatures computed from its own state', () => {
    expect(fixture.match.melodySignature).toBe(
      melodySignature(fixture.initialState.fragment.events),
    );
    expect(fixture.match.boundarySignature).toBe(
      boundarySignature(fixture.initialState.boundaryConstraints),
    );
    expect(fixture.match.acceptedHarmonySignature).toBe(
      acceptedHarmonySignature(fixture.initialState.acceptedContext.previousHarmony),
    );
  });

  it('marks every candidate as fixture-authored', () => {
    for (const candidate of candidates) {
      expect(candidate.provenance.fixtureAuthored).toBe(true);
    }
  });

  it('keeps every soprano identical to the melody', () => {
    const melodyMidis = fixture.initialState.fragment.events.map((event) => event.pitch.midi);
    for (const candidate of candidates) {
      expect(candidate.voicing.soprano.map((event) => event.pitch.midi)).toEqual(melodyMidis);
    }
  });

  it('keeps every voice inside the fragment without overlaps (rests are allowed)', () => {
    // A voice may be silent for part of the fragment (enter late, drop out),
    // but its events must stay in bounds and must not overlap each other.
    const fragmentUnits = totalUnits(fixture.initialState.fragment);
    expect(fragmentUnits).toBe(16);
    for (const candidate of candidates) {
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
          expect(spans[index].startUnit - 1 + spans[index].spanUnits).toBeLessThanOrEqual(
            fragmentUnits,
          );
          if (index > 0) {
            expect(spans[index].startUnit).toBeGreaterThanOrEqual(
              spans[index - 1].startUnit + spans[index - 1].spanUnits,
            );
          }
        }
      }
    }
  });

  it('tiles harmony events over the fragment and respects hold boundaries', () => {
    const fragmentUnits = totalUnits(fixture.initialState.fragment);
    const events = fixture.initialState.fragment.events;
    const holdStartUnits = fixture.initialState.boundaryConstraints
      .filter((constraint) => constraint.policy === 'hold')
      .map((constraint) => {
        const event = events.find((melody) => melody.id === constraint.afterMelodyEventId);
        if (!event) throw new Error('boundary references an unknown melody event');
        const span = toTimelineSpan(event.start, event.duration);
        return span.startUnit + span.spanUnits;
      });

    for (const candidate of candidates) {
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

  it('resolves every descriptor evidence reference', () => {
    for (const candidate of candidates) {
      const evidenceIds = new Set(candidate.evidence.map((evidence) => evidence.id));
      for (const descriptor of candidate.descriptors) {
        for (const evidenceId of descriptor.evidenceIds) {
          expect(evidenceIds.has(evidenceId)).toBe(true);
        }
      }
    }
  });

  it('interprets every melody event against real harmony events', () => {
    const melodyIds = new Set(fixture.initialState.fragment.events.map((event) => event.id));
    for (const candidate of candidates) {
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
});
