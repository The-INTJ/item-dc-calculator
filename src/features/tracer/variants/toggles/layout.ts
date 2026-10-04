import type { Layout } from '../../engine';
import { layoutById, LAYOUTS } from '../layouts';
import type { Toggle } from './types';

function squares(layout: Layout, kind: 'tracer' | 'king'): string[] {
  return layout.pieces.filter((p) => p.kind === kind).map((p) => `${p.file}${1 + p.row}`);
}

function list(items: string[]): string {
  return items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

export const LAYOUT_TOGGLE: Toggle<'layout'> = {
  key: 'layout',
  group: 'Board',
  label: 'Starting layout',
  help: 'Where White’s pieces start; Black’s mirror them.',
  control: { kind: 'custom', id: 'layout' },
  describe: (layout) =>
    `${layout.name} layout: king on ${list(squares(layout, 'king'))}, Tracers on ${list(squares(layout, 'tracer'))} (mirrored for Black).`,
  inert: () => null,
  same: (a, b) => a.id === b.id,
  param: 'layout',
  encode: (layout) => layout.id,
  decode: (text) => layoutById(text),
  samples: [...LAYOUTS],
};
