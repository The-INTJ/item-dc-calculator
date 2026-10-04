import { KING_MEMORY, type KingMemory } from '../../engine';
import type { Toggle } from './types';

const DESCRIPTIONS: Record<KingMemory, string> = {
  none: 'The king borrows no patterns; it steps one square at a time.',
  current: 'The king borrows each living Tracer’s current pattern; a captured Tracer’s pattern is lost.',
  'current-kept': 'The king borrows each Tracer’s latest pattern, and keeps it if that Tracer is captured.',
  'every-chart': 'The king learns every pattern its Tracers ever chart, for the rest of the game.',
};

export const KING_MEMORY_TOGGLE: Toggle<'kingMemory'> = {
  key: 'kingMemory',
  group: 'King',
  label: 'King’s patterns',
  help: 'What the king may move by besides its one-square step.',
  control: {
    kind: 'choice',
    options: {
      none: 'None — just its step',
      current: 'Its Tracers’ current patterns',
      'current-kept': 'Current patterns, kept when a Tracer falls',
      'every-chart': 'Every pattern ever charted',
    },
  },
  describe: (value) => DESCRIPTIONS[value],
  inert: () => null,
  param: 'king',
  encode: (value) => value,
  decode: (text) => KING_MEMORY.find((value) => value === text) ?? null,
  samples: [...KING_MEMORY],
};
