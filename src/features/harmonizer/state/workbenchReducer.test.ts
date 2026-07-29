import { describe, expect, it } from 'vitest';
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
