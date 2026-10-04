import type { Toggle } from './types';

export const LONE_KING_TOGGLE: Toggle<'loneKingWins'> = {
  key: 'loneKingWins',
  group: 'Ending',
  label: 'Lone king loses',
  help: 'Capturing the last piece beside the enemy king wins the game.',
  control: { kind: 'switch' },
  describe: (value) =>
    value
      ? 'Capture the king — or the last piece beside it — to win.'
      : 'Only capturing the king wins; a lone king plays on.',
  inert: () => null,
  param: 'lone',
  encode: (value) => (value ? 'on' : 'off'),
  decode: (text) => (text === 'on' ? true : text === 'off' ? false : null),
  samples: [true, false],
};

export const DODGE_DRAW_TOGGLE: Toggle<'dodgeDraw'> = {
  key: 'dodgeDraw',
  group: 'Ending',
  label: 'Dodge draw',
  help: 'Dodges in a row (with no capture) that draw the game.',
  control: { kind: 'number', min: 0, max: 20, zeroLabel: 'Off' },
  describe: (value) =>
    value === 0 ? 'Dodging never draws the game.' : `${value} dodges in a row by one player, with no capture, draws the game.`,
  inert: (rules) => (rules.freeStep === 'off' ? 'There are no free king steps under these rules.' : null),
  param: 'dodge',
  encode: (value) => String(value),
  decode: (text) => (/^\d{1,2}$/.test(text) && Number(text) <= 20 ? Number(text) : null),
  samples: [0, 3, 6, 10],
};

export const DODGE_THREAT_TOGGLE: Toggle<'dodgeNeedsThreat'> = {
  key: 'dodgeNeedsThreat',
  group: 'Ending',
  label: 'Dodges need a threat',
  help: 'Only a free king step taken while the king is threatened counts as a dodge.',
  control: { kind: 'switch' },
  describe: (value) =>
    value
      ? 'A dodge is a free king step taken while the king is threatened; any other turn resets the count.'
      : 'Every free king step counts as a dodge; a turn without one resets the count.',
  inert: (rules) => {
    if (rules.freeStep === 'off') return 'There are no free king steps under these rules.';
    return rules.dodgeDraw === 0 ? 'Dodging never draws under these rules.' : null;
  },
  param: 'threat',
  encode: (value) => (value ? 'on' : 'off'),
  decode: (text) => (text === 'on' ? true : text === 'off' ? false : null),
  samples: [true, false],
};
