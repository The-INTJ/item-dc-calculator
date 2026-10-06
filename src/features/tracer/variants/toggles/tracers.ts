import { CHART_LANDING, PATTERN_ORIENTATIONS, type ChartLanding, type PatternOrientations } from '../../engine';
import type { Toggle } from './types';

const ORIENTATION_TEXT: Record<PatternOrientations, string> = {
  all: 'Patterns work in all eight orientations — turned and mirrored.',
  'as-traced': 'Patterns work only exactly as traced, out from wherever the piece stands.',
};

export const ORIENTATIONS_TOGGLE: Toggle<'patternOrientations'> = {
  key: 'patternOrientations',
  group: 'Tracers',
  label: 'Pattern directions',
  help: 'Whether a pattern can be turned and mirrored, or only works the way it was drawn.',
  control: { kind: 'choice', options: { all: 'All eight orientations', 'as-traced': 'Only as traced' } },
  describe: (value) => ORIENTATION_TEXT[value],
  inert: () => null,
  param: 'dirs',
  encode: (value) => value,
  decode: (text) => PATTERN_ORIENTATIONS.find((value) => value === text) ?? null,
  samples: [...PATTERN_ORIENTATIONS],
};

const LANDING_TEXT: Record<ChartLanding, string> = {
  end: 'A charting Tracer moves to the end of its path.',
  any: 'A charting Tracer stops anywhere along its path — or stays where it is.',
};

export const LANDING_TOGGLE: Toggle<'chartLanding'> = {
  key: 'chartLanding',
  group: 'Tracers',
  label: 'Where a chart stops',
  help: 'Where a Tracer ends up after charting a path.',
  control: { kind: 'choice', options: { end: 'At the end of the path', any: 'Anywhere along it, or stay' } },
  describe: (value) => LANDING_TEXT[value],
  inert: () => null,
  param: 'land',
  encode: (value) => value,
  decode: (text) => CHART_LANDING.find((value) => value === text) ?? null,
  samples: [...CHART_LANDING],
};

export const TRACER_STEP_TOGGLE: Toggle<'tracerStep'> = {
  key: 'tracerStep',
  group: 'Tracers',
  label: 'Tracers can step',
  help: 'A Tracer may step one square in any direction instead — never capturing.',
  control: { kind: 'switch' },
  describe: (value) =>
    value
      ? 'A Tracer may also step one square in any direction — never capturing.'
      : 'Tracers move only by charting and by their pattern.',
  inert: () => null,
  param: 'tstep',
  encode: (value) => (value ? 'on' : 'off'),
  decode: (text) => (text === 'on' ? true : text === 'off' ? false : null),
  samples: [true, false],
};
