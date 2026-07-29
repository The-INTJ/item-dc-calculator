import { describe, expect, it } from 'vitest';
import type { ConstraintLock } from '../domain/locks';
import { durationToUnits, timeToUnits } from '../domain/timing';
import { getDefaultFixture } from '../fixtures/registry';
import {
  createInitialWorkbenchState,
  MAX_TEMPO_BPM,
  MIN_TEMPO_BPM,
  workbenchReducer,
} from './workbenchReducer';

const fixture = getDefaultFixture();

describe('createInitialWorkbenchState', () => {
  it('seeds the workbench from the fixture with candidate A preview-selected', () => {
    const state = createInitialWorkbenchState(fixture);
    expect(state.suggestionStatus).toBe('fresh');
    expect(state.candidateSetId).toBe('default');
    expect(state.candidates).toHaveLength(3);
    expect(state.selectedCandidateId).toBe('grounded-descent');
    expect(state.tempoBpm).toBe(76);
    expect(state.phraseIntent).toBe('continue');
    expect(state.locks).toEqual([]);
    expect(state.history).toEqual([]);
    expect(state.future).toEqual([]);
    expect(state.playback).toEqual({ status: 'idle' });
  });

  it('reports an empty status when a fixture has no candidates', () => {
    const emptyFixture = {
      ...fixture,
      id: 'empty-test',
      candidateSets: [{ id: 'default', candidates: [] }],
    };
    const state = createInitialWorkbenchState(emptyFixture);
    expect(state.suggestionStatus).toBe('empty');
    expect(state.selectedCandidateId).toBeNull();
  });
});

describe('workbenchReducer', () => {
  const initial = createInitialWorkbenchState(fixture);

  it('LOAD_FIXTURE resets from the given fixture', () => {
    const emptyFixture = {
      ...fixture,
      id: 'other',
      candidateSets: [{ id: 'default', candidates: [] }],
    };
    const midway = workbenchReducer(initial, {
      type: 'SELECT_CANDIDATE',
      candidateId: 'keep-moving',
    });
    const state = workbenchReducer(midway, { type: 'LOAD_FIXTURE', fixture: emptyFixture });
    expect(state.suggestionStatus).toBe('empty');
    expect(state.selectedCandidateId).toBeNull();
  });

  it('SELECT_CANDIDATE switches the selection', () => {
    const state = workbenchReducer(initial, {
      type: 'SELECT_CANDIDATE',
      candidateId: 'keep-moving',
    });
    expect(state.selectedCandidateId).toBe('keep-moving');
  });

  it('SELECT_CANDIDATE ignores unknown and already-selected ids', () => {
    expect(
      workbenchReducer(initial, { type: 'SELECT_CANDIDATE', candidateId: 'nope' }),
    ).toBe(initial);
    expect(
      workbenchReducer(initial, { type: 'SELECT_CANDIDATE', candidateId: 'grounded-descent' }),
    ).toBe(initial);
  });

  it('SET_TEMPO rounds and clamps', () => {
    expect(workbenchReducer(initial, { type: 'SET_TEMPO', tempoBpm: 88.4 }).tempoBpm).toBe(88);
    expect(workbenchReducer(initial, { type: 'SET_TEMPO', tempoBpm: 1 }).tempoBpm).toBe(
      MIN_TEMPO_BPM,
    );
    expect(workbenchReducer(initial, { type: 'SET_TEMPO', tempoBpm: 999 }).tempoBpm).toBe(
      MAX_TEMPO_BPM,
    );
    expect(workbenchReducer(initial, { type: 'SET_TEMPO', tempoBpm: 76 })).toBe(initial);
  });

  it('RESIZE_VOICE_EVENT reshapes a voice and mirrors soprano edits onto the melody', () => {
    // Candidate C's alto is three events (q q h); move the first boundary 4 → 6.
    const altoResized = workbenchReducer(initial, {
      type: 'RESIZE_VOICE_EVENT',
      candidateId: 'keep-moving',
      voice: 'alto',
      eventId: 'c-a-1',
      edge: 'right',
      targetBoundary: 6,
      ripple: false,
    });
    const alto = altoResized.candidates[2].voicing.alto;
    expect(durationToUnits(alto[0].duration)).toBe(6);
    expect(timeToUnits(alto[1].start)).toBe(6);
    expect(durationToUnits(alto[1].duration)).toBe(2);
    // Other voices, candidates, and the fragment are untouched.
    expect(altoResized.candidates[2].voicing.bass).toBe(initial.candidates[2].voicing.bass);
    expect(altoResized.candidates[0]).toBe(initial.candidates[0]);
    expect(altoResized.fragment).toBe(initial.fragment);

    // Soprano edits mirror onto the melody fragment (same index).
    const sopranoResized = workbenchReducer(initial, {
      type: 'RESIZE_VOICE_EVENT',
      candidateId: 'grounded-descent',
      voice: 'soprano',
      eventId: 'a-s-1',
      edge: 'right',
      targetBoundary: 6,
      ripple: false,
    });
    const soprano = sopranoResized.candidates[0].voicing.soprano;
    const melody = sopranoResized.fragment.events;
    expect(durationToUnits(soprano[0].duration)).toBe(6);
    expect(durationToUnits(melody[0].duration)).toBe(6);
    expect(timeToUnits(melody[1].start)).toBe(6);
    expect(durationToUnits(melody[1].duration)).toBe(2);

    // A no-op drag returns the same state reference.
    expect(
      workbenchReducer(initial, {
        type: 'RESIZE_VOICE_EVENT',
        candidateId: 'grounded-descent',
        voice: 'soprano',
        eventId: 'a-s-1',
        edge: 'right',
        targetBoundary: 4,
        ripple: false,
      }),
    ).toBe(initial);
  });

  it('TOGGLE_LOCK adds a lock once and removes it on repeat', () => {
    const lock: ConstraintLock = {
      id: 'lock-c-a-1',
      targetType: 'voice_event',
      targetId: 'c-a-1',
      candidateId: 'keep-moving',
      valueSnapshot: null,
      createdAt: '2026-07-29T00:00:00.000Z',
    };
    const locked = workbenchReducer(initial, { type: 'TOGGLE_LOCK', lock });
    expect(locked.locks).toHaveLength(1);
    const unlocked = workbenchReducer(locked, { type: 'TOGGLE_LOCK', lock: { ...lock, id: 'x' } });
    expect(unlocked.locks).toHaveLength(0);
  });

  it('runs the playback lifecycle and drops late cursor updates', () => {
    const playing = workbenchReducer(initial, {
      type: 'START_PLAYBACK',
      candidateId: 'strong-arrival',
      voices: ['soprano', 'bass'],
    });
    expect(playing.playback).toEqual({
      status: 'playing',
      candidateId: 'strong-arrival',
      voices: ['soprano', 'bass'],
      activeUnit: null,
    });

    const progressed = workbenchReducer(playing, { type: 'PLAYBACK_PROGRESS', activeUnit: 5 });
    expect(progressed.playback).toMatchObject({ status: 'playing', activeUnit: 5 });

    const stopped = workbenchReducer(progressed, { type: 'STOP_PLAYBACK' });
    expect(stopped.playback).toEqual({ status: 'idle' });
    expect(workbenchReducer(stopped, { type: 'STOP_PLAYBACK' })).toBe(stopped);

    const late = workbenchReducer(stopped, { type: 'PLAYBACK_PROGRESS', activeUnit: 9 });
    expect(late).toBe(stopped);
  });
});
