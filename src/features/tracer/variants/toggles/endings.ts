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
  help: 'Free king steps in a row (with no capture) that draw the game.',
  control: { kind: 'number', min: 0, max: 20, zeroLabel: 'Off' },
  describe: (value) =>
    value === 0
      ? 'Free king steps never draw the game.'
      : `${value} free king steps in a row by one player, with no capture, draws the game.`,
  inert: (rules) => (rules.freeStep === 'off' ? 'There are no free king steps under these rules.' : null),
  param: 'dodge',
  encode: (value) => String(value),
  decode: (text) => (/^\d{1,2}$/.test(text) && Number(text) <= 20 ? Number(text) : null),
  samples: [0, 3, 6, 10],
};
