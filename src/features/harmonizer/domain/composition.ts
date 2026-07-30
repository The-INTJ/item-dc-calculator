/**
 * The composition: the applied fragments read end to end as one piece.
 *
 * Applied fragments are each authored from bar 1, so playing or measuring the
 * hymn means retiming them onto one continuous timeline. Pure and
 * deterministic — the reducer and components both use it, and nothing here
 * mutates a stored fragment.
 *
 * Future work Drew has flagged (deliberately NOT here yet): per-chord tallies
 * across the hymn, and progression stats that spot a cadence the piece has
 * used before. Both are read-only analyses over exactly this concatenation.
 */

import type { CandidatePath } from './analysis-types';
import type { HarmonyEvent, SATBVoicing, VoiceEvent, VoiceId } from './music-types';
import { toTimelineSpan, unitsToDuration, unitsToTime, voicingUnits } from './timing';
import type { AppliedFragment } from './workbench-state';

const VOICES: VoiceId[] = ['soprano', 'alto', 'tenor', 'bass'];

export interface CompositionSpan {
  appliedId: string;
  /** 0-based unit offset of this fragment on the hymn timeline. */
  startUnit: number;
  units: number;
}

/**
 * Where each applied fragment sits on the hymn timeline, in order.
 * Concatenates raw units and re-times with unitsToTime, which assumes one
 * uniform meter — measures in different meters would need barline-aware
 * offsets. See the meter ledger in domain/timing.ts.
 */
export function compositionSpans(applied: readonly AppliedFragment[]): CompositionSpan[] {
  const spans: CompositionSpan[] = [];
  let offset = 0;
  for (const entry of applied) {
    const units = Math.max(voicingUnits(entry.candidate.voicing), 1);
    spans.push({ appliedId: entry.id, startUnit: offset, units });
    offset += units;
  }
  return spans;
}

/** Total length of the hymn so far, in units. */
export function compositionUnits(applied: readonly AppliedFragment[]): number {
  return compositionSpans(applied).reduce((total, span) => total + span.units, 0);
}

/** The applied fragment sounding at a 1-based hymn unit, or null. */
export function appliedIdAtUnit(
  applied: readonly AppliedFragment[],
  activeUnit: number | null,
): string | null {
  if (activeUnit === null) return null;
  const unit0 = activeUnit - 1;
  const span = compositionSpans(applied).find(
    (entry) => entry.startUnit <= unit0 && unit0 < entry.startUnit + entry.units,
  );
  return span?.appliedId ?? null;
}

function shiftEvent<T extends VoiceEvent>(event: T, offsetUnits: number): T {
  const span = toTimelineSpan(event.start, event.duration);
  return {
    ...event,
    id: `${event.id}@${offsetUnits}`,
    start: unitsToTime(span.startUnit - 1 + offsetUnits),
    duration: unitsToDuration(span.spanUnits),
  };
}

function shiftHarmony(event: HarmonyEvent, offsetUnits: number): HarmonyEvent {
  const span = toTimelineSpan(event.start, event.duration);
  return {
    ...event,
    id: `${event.id}@${offsetUnits}`,
    start: unitsToTime(span.startUnit - 1 + offsetUnits),
    duration: unitsToDuration(span.spanUnits),
  };
}

/** Id of the synthetic whole-hymn reading (never a real candidate id). */
export const COMPOSITION_CANDIDATE_ID = 'composition';

/**
 * The applied fragments as a single playable reading. Returns null when
 * nothing has been applied yet. Voicing and chords are retimed; the
 * interpretive fields stay empty because this is a projection for playback and
 * display, not an authored reading of its own.
 */
export function compositionCandidate(applied: readonly AppliedFragment[]): CandidatePath | null {
  if (applied.length === 0) return null;
  const spans = compositionSpans(applied);
  const voicing: SATBVoicing = { soprano: [], alto: [], tenor: [], bass: [] };
  const harmonyEvents: HarmonyEvent[] = [];

  applied.forEach((entry, index) => {
    const offset = spans[index].startUnit;
    for (const voice of VOICES) {
      for (const event of entry.candidate.voicing[voice]) {
        voicing[voice].push(shiftEvent(event, offset));
      }
    }
    for (const harmony of entry.candidate.harmonyEvents) {
      harmonyEvents.push(shiftHarmony(harmony, offset));
    }
  });

  const first = applied[0].candidate;
  return {
    id: COMPOSITION_CANDIDATE_ID,
    title: first.title,
    summary: '',
    tonalContext: first.tonalContext,
    phraseIntent: first.phraseIntent,
    harmonyEvents,
    voicing,
    melodyInterpretations: [],
    descriptors: [],
    evidence: [],
    provenance: {
      generatorId: 'composition',
      generatorVersion: '0.1.0',
      knowledgePackIds: [],
      fixtureAuthored: false,
    },
  };
}
