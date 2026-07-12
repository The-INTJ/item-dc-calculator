import { describe, expect, it } from 'vitest';

import { isPlantTrackerEmailAllowed } from './access';

describe('isPlantTrackerEmailAllowed', () => {
  it.each([
    'drew@taylorspot.com',
    ' DREW@TAYLORSPOT.COM ',
    'drewwithredhair@gmail.com',
  ])('allows an approved Firebase email: %s', (email) => {
    expect(isPlantTrackerEmailAllowed(email)).toBe(true);
  });

  it.each([undefined, null, '', 'drew@taylorspot', 'someone@example.com'])(
    'rejects an unapproved identity: %s',
    (email) => {
      expect(isPlantTrackerEmailAllowed(email)).toBe(false);
    },
  );
});
