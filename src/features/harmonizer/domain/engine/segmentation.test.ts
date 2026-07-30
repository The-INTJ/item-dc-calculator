import { describe, expect, it } from 'vitest';
import type { SATBVoicing, VoiceEvent, VoiceId } from '../music-types';
import { parsePitch } from '../pitch';
import { unitsToDuration, unitsToTime } from '../timing';
import { segmentSurface } from './segmentation';

let nextId = 0;
function note(voice: VoiceId, spn: string, startUnit: number, units: number): VoiceEvent {
  nextId += 1;
  return {
    id: `seg-${voice}-${nextId}`,
    voice,
    pitch: parsePitch(spn),
    scaleDegree: { degree: 1, chromaticOffset: 0, syllable: 'do' },
    start: unitsToTime(startUnit),
    duration: unitsToDuration(units),
    tieFromPrevious: false,
  };
}

function voicing(events: VoiceEvent[]): SATBVoicing {
  return {
    soprano: events.filter((event) => event.voice === 'soprano'),
    alto: events.filter((event) => event.voice === 'alto'),
    tenor: events.filter((event) => event.voice === 'tenor'),
    bass: events.filter((event) => event.voice === 'bass'),
  };
}

describe('segmentSurface', () => {
  it('keeps strong-beat chord changes as separate segments', () => {
    const segments = segmentSurface(
      voicing([
        note('soprano', 'G4', 0, 8),
        note('soprano', 'A4', 8, 8),
        note('tenor', 'E4', 0, 8),
        note('tenor', 'F4', 8, 8),
        note('bass', 'C3', 0, 8),
        note('bass', 'F2', 8, 8),
      ]),
    );
    expect(segments).toHaveLength(2);
    expect(segments[0].reading.kind).toBe('exact');
    expect(segments[1].start).toBe(8);
    expect(segments[1].reading.kind).toBe('incomplete_triad'); // F+A, no fifth
  });

  it('absorbs a weak passing sixteenth into the held chord', () => {
    // Soprano walks G–F–E over held C-major tones; the F starts off-beat.
    const segments = segmentSurface(
      voicing([
        note('soprano', 'G4', 0, 6),
        note('soprano', 'F4', 6, 2),
        note('soprano', 'E4', 8, 8),
        note('alto', 'E4', 0, 16),
        note('bass', 'C3', 0, 16),
      ]),
    );
    // The F does not create its own chord — the opening C-major span holds.
    expect(segments[0].start).toBe(0);
    expect(segments[0].units).toBeGreaterThanOrEqual(8);
    expect(segments[0].reading.kind).toBe('exact');
    if (segments[0].reading.kind === 'exact') {
      expect(segments[0].reading.root.letter).toBe('C');
    }
    expect(
      segments[0].ornamental.some((entry) => entry.pitch.letter === 'F'),
    ).toBe(true);
  });

  it('does not absorb a moving note that never resolves by step', () => {
    const segments = segmentSurface(
      voicing([
        note('soprano', 'G4', 0, 12),
        note('soprano', 'F4', 12, 4), // weak start, but nothing follows
        note('alto', 'E4', 0, 16),
        note('bass', 'C3', 0, 16),
      ]),
    );
    expect(segments.length).toBeGreaterThan(1);
  });

  it('re-reads a prepared, resolving sus4 as the triad with a 4-3 suspension', () => {
    // Fixture B's shape: held C over the arriving G — Gsus4 by pitch content,
    // V with a 4-3 suspension by preparation and resolution.
    const segments = segmentSurface(
      voicing([
        note('soprano', 'C5', 0, 12),
        note('soprano', 'B4', 12, 4),
        note('alto', 'E4', 0, 8),
        note('alto', 'D4', 8, 8),
        note('tenor', 'G3', 0, 16),
        note('bass', 'C3', 0, 8),
        note('bass', 'G2', 8, 8),
      ]),
    );
    const upgraded = segments.find((segment) => segment.suspensionFigure === '4-3');
    expect(upgraded).toBeDefined();
    expect(upgraded!.reading.kind).toBe('subset');
    if (upgraded!.reading.kind === 'subset') {
      expect(upgraded!.reading.root.letter).toBe('G');
      expect(upgraded!.reading.quality).toBe('major');
      expect(upgraded!.reading.leftovers[0]?.pitch.letter).toBe('C');
    }
  });

  it('leaves an unprepared or unresolved sus4 exactly as it sounds', () => {
    const segments = segmentSurface(
      voicing([
        note('soprano', 'C5', 8, 8), // arrives fresh — no preparation
        note('tenor', 'G3', 8, 8),
        note('bass', 'G2', 8, 8),
        note('alto', 'D4', 8, 8),
      ]),
    );
    expect(segments[0].suspensionFigure).toBeUndefined();
    expect(segments[0].reading.kind).toBe('exact');
    if (segments[0].reading.kind === 'exact') {
      expect(segments[0].reading.quality).toBe('suspended_fourth');
    }
  });
});
