/**
 * Template-matching machinery: exact pc-set matching against the sonority
 * templates (bass-first root order) and stacking matched tones from the root.
 */

import type { SpelledPitchClass } from '../../music-types';
import { SONORITY_TEMPLATES, type SonorityTemplate } from './sonority-templates';

/** Exact template match over a pc set; roots tried in the given order. */
export function exactMatch(
  pcs: number[],
  rootOrder: number[],
): { rootPc: number; template: SonorityTemplate } | null {
  for (const rootPc of rootOrder) {
    const relative = new Set(pcs.map((pc) => (pc - rootPc + 12) % 12));
    for (const template of SONORITY_TEMPLATES) {
      if (
        relative.size === template.intervals.length &&
        template.intervals.every((interval) => relative.has(interval))
      ) {
        return { rootPc, template };
      }
    }
  }
  return null;
}

export function rootOrderFor(pcs: number[], bassPc: number): number[] {
  return [bassPc, ...pcs.filter((pc) => pc !== bassPc)];
}

/** Chord tones stacked from the root, spelled from the sounding instances. */
export function stackedTones(
  tones: SpelledPitchClass[],
  rootPc: number,
  template: SonorityTemplate,
): SpelledPitchClass[] {
  return template.intervals
    .map((interval) => tones.find((tone) => tone.pitchClass === (rootPc + interval) % 12))
    .filter((tone): tone is SpelledPitchClass => tone !== undefined);
}
