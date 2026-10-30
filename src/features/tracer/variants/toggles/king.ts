import { KING_BORROW, KING_MEMORY, type KingBorrow, type KingMemory } from '../../engine';
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
      current: 'Current patterns',
      'current-kept': 'Current, kept on capture',
      'every-chart': 'Every pattern charted',
    },
  },
  describe: (value) => DESCRIPTIONS[value],
  inert: () => null,
  param: 'king',
  encode: (value) => value,
  decode: (text) => KING_MEMORY.find((value) => value === text) ?? null,
  samples: [...KING_MEMORY],
};

const BORROW_TEXT: Record<KingBorrow, string> = {
  'any-time': 'The king may move by any pattern it borrows, on any turn.',
  declared:
    'The king spends a turn declaring one borrowed pattern (the opponent sees it); from its next turn it may move by that one, until it declares another.',
};

export const KING_BORROW_TOGGLE: Toggle<'kingBorrow'> = {
  key: 'kingBorrow',
  group: 'King',
  label: 'Using borrowed moves',
  help: 'Whether the king uses borrowed patterns at once, or must declare one a turn ahead.',
  control: { kind: 'choice', options: { 'any-time': 'Any time', declared: 'Declared a turn ahead' } },
  describe: (value) => BORROW_TEXT[value],
  inert: (rules) => (rules.kingMemory === 'none' ? 'The king borrows no patterns under these rules.' : null),
  param: 'borrow',
  encode: (value) => value,
  decode: (text) => KING_BORROW.find((value) => value === text) ?? null,
  samples: [...KING_BORROW],
};
