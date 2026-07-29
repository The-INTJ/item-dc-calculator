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
  it('matches the authored fixture for its own state, ignoring phrase intent', () => {
    const result = resolveSuggestions({ ...baseInput(), phraseIntent: 'close' });
    expect(result.kind).toBe('replace');
    if (result.kind !== 'replace') return;
    expect(result.suggestionSource).toBe('authored');
    expect(result.sourceFixtureId).toBe(fixture.id);
    expect(result.candidates).toHaveLength(3);
    expect(result.boundaryConstraints).not.toBeNull();
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

  it('adopts an authored lock set when the signature matches exactly', () => {
    // Lock candidate A's whole-note bass (C3): matches 'bass@0:16=C3'.
    const grounded = resolveSuggestions({
      ...baseInput(),
      locks: [lockFor('grounded-descent', 'a-b-1')],
    });
    expect(grounded.kind).toBe('replace');
    if (grounded.kind === 'replace') {
      expect(grounded.suggestionSource).toBe('authored');
      expect(grounded.candidateSetId).toBe('locked-bass-grounded');
      expect(grounded.candidates.map((candidate) => candidate.title)).toContain('Pedal fourth');
      // The lock is remapped onto every adopted candidate's matching note.
      expect(grounded.locks).toHaveLength(3);
      expect(
        grounded.locks?.every(
          (lock) =>
            lock.targetType === 'voice_event' &&
            grounded.candidates.some((candidate) => candidate.id === lock.candidateId),
        ),
      ).toBe(true);
    }
    // Lock candidate B's two bass notes: matches 'bass@0:8=G2|bass@8:8=C3'.
    const arrival = resolveSuggestions({
      ...baseInput(),
      locks: [lockFor('strong-arrival', 'b-b-1'), lockFor('strong-arrival', 'b-b-2')],
    });
    expect(arrival.kind).toBe('replace');
    if (arrival.kind === 'replace') {
      expect(arrival.suggestionSource).toBe('authored');
      expect(arrival.candidateSetId).toBe('locked-bass-arrival');
      expect(arrival.candidates.map((candidate) => candidate.title)).toContain('Cadential 6-4');
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

  it('builds constrained sketches with ? spans when no chord satisfies the locks', () => {
    // Candidate A's whole-bar alto E4: E and the melody's fa (F) never share a
    // diatonic triad. Instead of a dead-end notice, the sketch keeps the
    // pinned note, marks the impossible span ?, and labels the gaps.
    const result = resolveSuggestions({
      ...baseInput(),
      locks: [lockFor('grounded-descent', 'a-a-1')],
    });
    expect(result.kind).toBe('replace');
    if (result.kind !== 'replace') return;
    expect(result.suggestionSource).toBe('computed');
    expect(result.candidates.length).toBeGreaterThan(0);
    for (const candidate of result.candidates) {
      // The pinned alto E4 is rendered verbatim as the whole alto lane.
      expect(candidate.voicing.alto.map((event) => event.pitch.midi)).toEqual([64]);
      // The fa span is an honest hole showing the sounding notes.
      const hole = candidate.harmonyEvents.find(
        (event) => event.analysis.romanNumeral === '?',
      );
      expect(hole).toBeTruthy();
      expect(hole?.displaySymbol).toBe('E+F');
      // Gaps are labeled needs-math / needs-custom, never silently filled.
      expect(
        candidate.derivability?.some((note) => note.status === 'needs_math'),
      ).toBe(true);
    }
    // Locks are remapped onto the sketches' pinned notes.
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
