import { FREE_STEP, type FreeStepRule } from '../../engine';
import type { Toggle } from './types';

const DESCRIPTIONS: Record<FreeStepRule, string> = {
  off: 'No free king step: moving the king is a whole turn.',
  'with-tracer': 'With a Tracer move, the king may also step one square (no capture), before or after it.',
  'with-tracer-or-warden': 'With a Tracer or Warden move, the king may also step one square (no capture), before or after it.',
};

export const FREE_STEP_TOGGLE: Toggle<'freeStep'> = {
  key: 'freeStep',
  group: 'Turn',
  label: 'Free king step',
  help: 'Which moves let the king also step one square in the same turn.',
  control: {
    kind: 'choice',
    options: {
      off: 'Never',
      'with-tracer': 'With a Tracer move',
      'with-tracer-or-warden': 'With a Tracer or Warden move',
    },
  },
  describe: (value) => DESCRIPTIONS[value],
  inert: () => null,
  param: 'step',
  encode: (value) => value,
  decode: (text) => FREE_STEP.find((value) => value === text) ?? null,
  samples: [...FREE_STEP],
};
