import { describe, expect, it } from 'vitest';
import { getContestDisplaySurface, normalizeContestKind } from '../displaySurface';

describe('displaySurface', () => {
  it('normalizes mixology-like configs to the mixology display kind', () => {
    expect(
      normalizeContestKind({
        topic: 'Friday Night Cocktails',
        entryLabel: 'Pour',
        attributes: [],
      }),
    ).toBe('mixology');

    expect(
      normalizeContestKind({
        topic: 'Anything',
        entryLabel: 'Drink',
        contestantLabel: 'Maker',
        attributes: [],
      }),
    ).toBe('mixology');
  });

  it('falls back to generic display kind for unknown contest topics', () => {
    expect(
      normalizeContestKind({
        topic: 'Cosplay',
        entryLabel: 'Costume',
        attributes: [],
      }),
    ).toBe('generic');
  });

  it('returns mixology-specific labels and symbols from the registry', () => {
    const surface = getContestDisplaySurface('mixology');

    expect(surface.nowPanelLabel).toBe('Now Shaking');
    expect(surface.centerIcon).toBe('local_bar');
    expect(surface.rainIcons).toContain('liquor');
  });
});
