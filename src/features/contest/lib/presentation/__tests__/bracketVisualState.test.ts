import { describe, expect, it } from 'vitest';
import {
  getColumnHeaderLabel,
  getMatchupVisualState,
} from '../bracketVisualState';

describe('getMatchupVisualState', () => {
  it('byes never pulse, even while their round is active', () => {
    expect(
      getMatchupVisualState({ isBye: true, phase: 'scored', matchupId: 'm-1' }, true),
    ).toBe('bye');
  });

  it('placeholder slots without a stored matchup are tbd', () => {
    expect(getMatchupVisualState({ matchupId: undefined }, false)).toBe('tbd');
    expect(getMatchupVisualState({ matchupId: undefined }, true)).toBe('tbd');
  });

  it('shaking matchups are live only in the active round', () => {
    expect(getMatchupVisualState({ matchupId: 'm-1', phase: 'shake' }, true)).toBe('live');
    expect(getMatchupVisualState({ matchupId: 'm-1', phase: 'shake' }, false)).toBe('set');
  });

  it('scored matchups read scored regardless of round activity', () => {
    expect(getMatchupVisualState({ matchupId: 'm-1', phase: 'scored' }, true)).toBe('scored');
    expect(getMatchupVisualState({ matchupId: 'm-1', phase: 'scored' }, false)).toBe('scored');
  });

  it('assigned-but-unopened matchups read set', () => {
    expect(getMatchupVisualState({ matchupId: 'm-1', phase: 'set' }, true)).toBe('set');
  });
});

describe('getColumnHeaderLabel', () => {
  it('labels the active round Now Playing', () => {
    expect(getColumnHeaderLabel({ isActive: true, status: 'active' })).toBe('Now Playing');
  });

  it('labels closed rounds Complete', () => {
    expect(getColumnHeaderLabel({ isActive: false, status: 'closed' })).toBe('Complete');
  });

  it('labels everything else Round', () => {
    expect(getColumnHeaderLabel({ isActive: false, status: 'upcoming' })).toBe('Round');
    expect(getColumnHeaderLabel({ isActive: false, status: 'pending' })).toBe('Round');
  });
});
