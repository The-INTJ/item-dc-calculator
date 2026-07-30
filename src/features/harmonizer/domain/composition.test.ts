import { describe, expect, it } from 'vitest';
import { getDefaultFixture } from '../fixtures/registry';
import {
  appliedIdAtUnit,
  compositionCandidate,
  compositionSpans,
  compositionUnits,
  COMPOSITION_CANDIDATE_ID,
} from './composition';
import { toTimelineSpan, voicingUnits } from './timing';
import type { AppliedFragment } from './workbench-state';

const fixture = getDefaultFixture();
const candidates = fixture.candidateSets[0].candidates;

/** Two applied pieces, each one measure long. */
const applied: AppliedFragment[] = [
  { id: 'p1', fragment: fixture.initialState.fragment, candidate: candidates[0] },
  { id: 'p2', fragment: fixture.initialState.fragment, candidate: candidates[1] },
];

describe('compositionSpans / compositionUnits', () => {
  it('lays the pieces end to end in order', () => {
    const spans = compositionSpans(applied);
    const firstLength = voicingUnits(candidates[0].voicing);
    expect(spans).toEqual([
      { appliedId: 'p1', startUnit: 0, units: firstLength },
      { appliedId: 'p2', startUnit: firstLength, units: voicingUnits(candidates[1].voicing) },
    ]);
    expect(compositionUnits(applied)).toBe(spans[0].units + spans[1].units);
    expect(compositionUnits([])).toBe(0);
  });
});

describe('appliedIdAtUnit', () => {
  it('reports which piece is sounding, and nothing when idle', () => {
    const firstLength = compositionSpans(applied)[0].units;
    expect(appliedIdAtUnit(applied, 1)).toBe('p1');
    expect(appliedIdAtUnit(applied, firstLength)).toBe('p1');
    expect(appliedIdAtUnit(applied, firstLength + 1)).toBe('p2');
    expect(appliedIdAtUnit(applied, null)).toBeNull();
    expect(appliedIdAtUnit(applied, 10_000)).toBeNull();
  });
});

describe('compositionCandidate', () => {
  it('is null until something has been applied', () => {
    expect(compositionCandidate([])).toBeNull();
  });

  it('retimes every piece onto one continuous timeline', () => {
    const hymn = compositionCandidate(applied);
    expect(hymn).not.toBeNull();
    if (!hymn) return;
    expect(hymn.id).toBe(COMPOSITION_CANDIDATE_ID);
    // Nothing is dropped: both pieces' notes are present in every voice.
    expect(hymn.voicing.soprano).toHaveLength(
      candidates[0].voicing.soprano.length + candidates[1].voicing.soprano.length,
    );
    // The second piece starts exactly where the first ends, in a later measure.
    const offset = compositionSpans(applied)[0].units;
    const secondPieceStart = toTimelineSpan(
      hymn.voicing.soprano[candidates[0].voicing.soprano.length].start,
      hymn.voicing.soprano[0].duration,
    ).startUnit;
    expect(secondPieceStart - 1).toBe(offset);
    expect(voicingUnits(hymn.voicing)).toBe(compositionUnits(applied));
    // Ids stay unique across repeats of the same reading.
    const ids = hymn.voicing.soprano.map((event) => event.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('carries no interpretive claims — it is a projection, not a reading', () => {
    const hymn = compositionCandidate(applied);
    expect(hymn?.melodyInterpretations).toEqual([]);
    expect(hymn?.descriptors).toEqual([]);
    expect(hymn?.evidence).toEqual([]);
    expect(hymn?.provenance.fixtureAuthored).toBe(false);
  });
});
