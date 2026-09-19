import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_STATE, loadGrassState, saveGrassState } from './storage';
import { care, PROFILE } from './fixtures/weather';

beforeEach(() => localStorage.clear());

describe('grass state persistence', () => {
  it('starts with no selected area or invented weeds', () => {
    expect(loadGrassState().selectedSegmentId).toBe('');
    expect(loadGrassState().profile.weedTypes).toEqual([]);
  });
  it('migrates the moved hill while preserving all logs, including the old treeline', () => {
    localStorage.setItem('grass-manager-state-v1', JSON.stringify({
      profile: PROFILE, selectedSegmentId: 'right-side-hill',
      events: [care('2026-09-17', 'right-side-hill'), care('2026-09-16', 'left-side'), care('2026-09-15', 'treeline-edge')],
    }));
    const state = loadGrassState();
    expect(state.events.map((event) => event.segmentId)).toEqual(['left-side-hill', 'right-side', 'treeline-edge']);
    expect(state.selectedSegmentId).toBe('');
    saveGrassState(state);
    expect(loadGrassState().events).toEqual(state.events);
  });
  it('persists profile, scopes and zone observations, but never opens an area on reload', () => {
    saveGrassState({ ...DEFAULT_STATE, profile: PROFILE, events: [care('2026-09-18')], selectedSegmentId: 'back-lawn',
      zones: { 'back-lawn': { sun: 'shade', condition: 'thin' } },
    });
    const state = loadGrassState();
    expect(state.zones['back-lawn'].sun).toBe('shade');
    expect(state.events[0].segmentId).toBe('whole-yard');
    expect(state.profile.configured).toBe(true);
    expect(state.selectedSegmentId).toBe('');
  });
  it('rejects corrupt values without breaking the page', () => {
    localStorage.setItem('grass-manager-state-v1', JSON.stringify({
      profile: { grassType: 'nope', location: { latitude: 'bad' }, sprinklerMinutes: -1 },
      events: [{ ...care('2026-02-30'), type: 'watered' }], zones: { bad: { sun: 'wrong' } },
    }));
    expect(loadGrassState().profile.grassType).toBe('mixed-unsure');
    expect(loadGrassState().profile.location).toBeNull();
    expect(loadGrassState().events).toEqual([]);
  });
});
