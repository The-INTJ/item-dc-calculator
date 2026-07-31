/**
 * One voice's notes and silences, turned into drawable symbols.
 *
 * Two things happen here that the lane view never had to do. A note may become
 * several symbols, because the grid allows lengths notation has no symbol for.
 * And the spaces between notes become rests: a lane can simply show a gap, but a
 * stave has to account for every beat.
 */

import type { TonalContext, VoiceEvent, VoiceId } from '../music-types';
import { toTimelineSpan } from '../timing';
import { decomposeNoteSpan, decomposeRestSpan } from './duration-notation';
import { printedAccidental } from './key-signature';
import { shapeForDegree } from './shape-glyphs';
import {
  ledgerStepsFor,
  restStepFor,
  staffStepFor,
  STAVE_OF_VOICE,
  STEM_DIRECTION_OF_VOICE,
} from './staff-position';
import type { NoteSymbol, RestSymbol } from './staff-types';

interface PlacedEvent {
  event: VoiceEvent;
  startUnit: number;
  units: number;
}

/**
 * Events on the 0-based grid, in time order. Measure zero holds the notional
 * approach context and lands before the start of the timeline, so it is dropped
 * rather than drawn.
 */
function placedEvents(events: VoiceEvent[]): PlacedEvent[] {
  return events
    .map((event) => {
      const span = toTimelineSpan(event.start, event.duration);
      return { event, startUnit: span.startUnit - 1, units: span.spanUnits };
    })
    .filter((placed) => placed.startUnit >= 0 && placed.units > 0)
    .sort((a, b) => a.startUnit - b.startUnit);
}

function noteSymbols(placed: PlacedEvent, voice: VoiceId, context: TonalContext): NoteSymbol[] {
  const { event } = placed;
  const stave = STAVE_OF_VOICE[voice];
  const stem = STEM_DIRECTION_OF_VOICE[voice];
  const step = staffStepFor(event.pitch.letter, event.pitch.octave, stave);
  const shape = shapeForDegree(context, event.scaleDegree.degree);
  const accidental = printedAccidental(event.pitch, context);
  const ledgerSteps = ledgerStepsFor(step);

  return decomposeNoteSpan(placed.startUnit, placed.units).map((value, index) => ({
    id: `${event.id}@${value.startUnit}`,
    eventId: event.id,
    voice,
    stave,
    startUnit: value.startUnit,
    units: value.units,
    base: value.base,
    dots: value.dots,
    shape,
    step,
    stem,
    ledgerSteps,
    // A tied continuation repeats neither the accidental nor the reason for it.
    accidental: index === 0 ? accidental : null,
    offsetHead: false,
    tieToNext: value.tieToNext,
    tieFromPrevious: index === 0 ? event.tieFromPrevious : true,
  }));
}

/**
 * A stretch of silence as written rests. `eventId` is present when the silence
 * is a SILENCED NOTE rather than an empty stretch of the bar — the rests look
 * the same either way, but only one of them is something you can point at.
 */
function restSymbols(
  gapStart: number,
  gapUnits: number,
  voice: VoiceId,
  eventId?: string,
): RestSymbol[] {
  const stave = STAVE_OF_VOICE[voice];
  return decomposeRestSpan(gapStart, gapUnits).map((rest) => ({
    id: `rest-${voice}@${rest.startUnit}`,
    voice,
    stave,
    startUnit: rest.startUnit,
    units: rest.units,
    base: rest.base,
    step: restStepFor(rest.base, voice),
    eventId,
  }));
}

/**
 * Every symbol one voice contributes. Gaps before, between and after the notes
 * all become rests, so the voice accounts for the whole width of the measure.
 */
export function voiceSymbols(
  events: VoiceEvent[],
  voice: VoiceId,
  context: TonalContext,
  gridUnits: number,
): { notes: NoteSymbol[]; rests: RestSymbol[] } {
  const notes: NoteSymbol[] = [];
  const rests: RestSymbol[] = [];
  let cursor = 0;

  for (const placed of placedEvents(events)) {
    if (placed.startUnit > cursor) {
      rests.push(...restSymbols(cursor, placed.startUnit - cursor, voice));
    }
    // A silenced note holds its place and its length; only its head goes away.
    if (placed.event.isRest) {
      rests.push(...restSymbols(placed.startUnit, placed.units, voice, placed.event.id));
    } else {
      notes.push(...noteSymbols(placed, voice, context));
    }
    cursor = Math.max(cursor, placed.startUnit + placed.units);
  }
  if (cursor < gridUnits) {
    rests.push(...restSymbols(cursor, gridUnits - cursor, voice));
  }

  return { notes, rests };
}
