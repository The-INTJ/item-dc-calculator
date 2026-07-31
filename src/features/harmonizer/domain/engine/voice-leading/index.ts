/**
 * Voice-leading FACTS — pure observations over an SATB surface. This module
 * never judges: parallels and open fifths are legitimate style in the
 * shape-note tradition this app serves, so severity (including "ignore
 * entirely") comes exclusively from a style pack. The math only reports what
 * happened and where.
 */

import type { TonalContext, VoiceId } from '../../music-types';
import type { AnalyzedSegment, PlacedVoiceNote } from '../segmentation';
import type { VoiceLeadingFact } from './facts';
import { pairFacts } from './pair-facts';
import { stateFacts } from './state-facts';
import { tendencyFacts } from './tendency-facts';
import { boundaries, stateAt, type VoiceState } from './voice-state';

export type { VoiceLeadingFact, VoiceLeadingFactId } from './facts';

/**
 * Every voice-leading observation on the surface, in timeline order.
 * Facts only — severities live in style packs.
 */
export function checkVoiceLeading(
  lines: Record<VoiceId, PlacedVoiceNote[]>,
  segments: AnalyzedSegment[],
  context: TonalContext,
): VoiceLeadingFact[] {
  const facts: VoiceLeadingFact[] = [];
  const starts = boundaries(lines);
  let previous: VoiceState | null = null;
  for (const unit of starts) {
    const state = stateAt(lines, unit);
    facts.push(...stateFacts(unit, state, context));
    if (previous) facts.push(...pairFacts(unit, previous, state));
    previous = state;
  }
  facts.push(...tendencyFacts(lines, segments, context));
  facts.sort((a, b) => a.atUnit - b.atUnit || a.id.localeCompare(b.id));
  return facts;
}
