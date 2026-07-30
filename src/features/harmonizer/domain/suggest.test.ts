import { describe, expect, it } from 'vitest';
import { getDefaultFixture, listFixtures } from '../fixtures/registry';
import type { ConstraintLock } from './locks';
import { resolveSuggestions, type SuggestInput } from './suggest';

const fixture = getDefaultFixture();
const fixtures = listFixtures();
const candidates = fixture.candidateSets[0].candidates;

function baseInput(): SuggestInput {
  return {
    fragment: fixture.initialState.fragment,
    tonalContext: fixture.initialState.tonalContext,
    phraseIntent: fixture.initialState.phraseIntent,
    acceptedContext: fixture.initialState.acceptedContext,
    boundaryConstraints: fixture.initialState.boundaryConstraints,
    locks: [],
    candidates,
    sourceFixtureId: fixture.id,
    fixtures,
  };
}

function lockFor(candidateId: string, targetId: string): ConstraintLock {
  return {
    id: `lock-${targetId}`,
    targetType: 'voice_event',
    targetId,
    candidateId,
    valueSnapshot: null,
    createdAt: '2026-07-29T00:00:00.000Z',
  };
}

describe('resolveSuggestions', () => {
  it('is engine-first: even the fixture melody in a supported key gets computed cards', () => {
    const result = resolveSuggestions({ ...baseInput(), phraseIntent: 'close' });
    expect(result.kind).toBe('replace');
    if (result.kind !== 'replace') return;
    expect(result.suggestionSource).toBe('computed');
    expect(result.candidates).toHaveLength(3);
    expect(
      result.candidates.every(
        (candidate) => candidate.provenance.generatorId === 'engine-generator',
      ),
    ).toBe(true);
    // Close intent ranks an authentic close on top for sol–fa–mi.
    expect(result.candidates[0].harmonyEvents.length).toBeGreaterThan(0);
  });

  it('falls back to computed skeletons for an unknown melody', () => {
    const input = baseInput();
    const edited = {
      ...input.fragment,
      events: input.fragment.events.map((event, index) =>
        index === 0
          ? {
              ...event,
              pitch: { ...event.pitch, letter: 'E' as const, midi: 64, pitchClass: 4 },
              scaleDegree: { degree: 3 as const, chromaticOffset: 0, syllable: 'mi' as const },
            }
          : event,
      ),
    };
    const result = resolveSuggestions({ ...input, fragment: edited });
    expect(result.kind).toBe('replace');
    if (result.kind !== 'replace') return;
    expect(result.suggestionSource).toBe('computed');
    expect(result.candidates.every((candidate) => !candidate.provenance.fixtureAuthored)).toBe(
      true,
    );
    expect(result.boundaryConstraints).toBeNull();
  });

  it('wildcard-matches fixtures without an accepted-harmony pin', () => {
    const input = baseInput();
    // Fixture A pins I:root; with a different accepted harmony it must NOT match.
    const noAccepted = resolveSuggestions({
      ...input,
      acceptedContext: { previousHarmony: null, previousVoicing: null },
    });
    expect(noAccepted.kind).toBe('replace');
    if (noAccepted.kind === 'replace') {
      expect(noAccepted.suggestionSource).toBe('computed');
    }
  });

  it('honors a satisfiable lock with engine candidates that keep the pinned note', () => {
    // Lock candidate A's whole-note bass (C3): every generated reading keeps
    // C3 sounding in the bass for the whole bar, and the lock is remapped
    // onto each new candidate so badges and unlocking survive the swap.
    const grounded = resolveSuggestions({
      ...baseInput(),
      locks: [lockFor('grounded-descent', 'a-b-1')],
    });
    expect(grounded.kind).toBe('replace');
    if (grounded.kind === 'replace') {
      expect(grounded.suggestionSource).toBe('computed');
      for (const candidate of grounded.candidates) {
        expect(candidate.voicing.bass.map((event) => event.pitch.midi)).toEqual([48]);
      }
      expect(grounded.locks?.length).toBeGreaterThan(0);
      expect(
        grounded.locks?.every(
          (lock) =>
            lock.targetType === 'voice_event' &&
            grounded.candidates.some((candidate) => candidate.id === lock.candidateId),
        ),
      ).toBe(true);
    }
  });

  it('uses computed lock filtering when no authored lock set exists', () => {
    // Lock candidate B's first bass note (G2, beats 1–2): every suggested chord
    // overlapping that span must contain pitch-class 7 (fa forces V7 there).
    const result = resolveSuggestions({
      ...baseInput(),
      locks: [lockFor('strong-arrival', 'b-b-1')],
    });
    expect(result.kind).toBe('replace');
    if (result.kind !== 'replace') return;
    expect(result.suggestionSource).toBe('computed');
    for (const candidate of result.candidates) {
      for (const harmony of candidate.harmonyEvents) {
        const startUnit =
          (harmony.start.measure - 1) * 16 + (harmony.start.beat - 1) * 4 + harmony.start.subdivision;
        if (startUnit < 8) {
          expect(harmony.chord.pitchClasses).toContain(7);
        }
      }
    }
  });

  it('explains a lock no chord satisfies as ornamental motion instead of a hole', () => {
    // Candidate A's whole-bar alto E4: E and the melody's fa (F) never share
    // a vocabulary chord. The POC showed an honest `?` here; the engine now
    // EXPLAINS it — fa reads as passing motion over the held chord, the
    // pinned E4 stays one sustained note, and nothing dead-ends.
    const result = resolveSuggestions({
      ...baseInput(),
      locks: [lockFor('grounded-descent', 'a-a-1')],
    });
    expect(result.kind).toBe('replace');
    if (result.kind !== 'replace') return;
    expect(result.suggestionSource).toBe('computed');
    expect(result.candidates.length).toBeGreaterThan(0);
    for (const candidate of result.candidates) {
      // The pinned alto E4 is one sustained verbatim note across the bar.
      expect(candidate.voicing.alto.map((event) => event.pitch.midi)).toEqual([64]);
      // No hole — the fa is classified, not abandoned.
      expect(
        candidate.harmonyEvents.some((event) => event.analysis.romanNumeral === '?'),
      ).toBe(false);
      const fa = candidate.melodyInterpretations[1];
      expect(['passing_tone', 'neighbor_tone', 'chord_tone']).toContain(fa.role);
      expect(
        candidate.derivability?.every((note) => note.aspect === 'effects' || note.status === 'computed'),
      ).toBe(true);
    }
    // Locks are remapped onto the new candidates' pinned notes.
    expect(result.locks?.length).toBeGreaterThan(0);
    expect(
      result.locks?.every((lock) =>
        result.candidates.some((candidate) => candidate.id === lock.candidateId),
      ),
    ).toBe(true);
  });

  it('returns empty for an empty fragment', () => {
    const input = baseInput();
    expect(
      resolveSuggestions({ ...input, fragment: { id: 'empty', events: [] } }).kind,
    ).toBe('empty');
  });
});
