import { describe, expect, it } from 'vitest';
import { getDefaultFixture } from '../fixtures/registry';
import { createInitialWorkbenchState, workbenchReducer } from './workbenchReducer';
import { getSelectedCandidate, toCandidatePathSummary } from './selectors';

const fixture = getDefaultFixture();
const candidates = fixture.candidateSets[0].candidates;

describe('toCandidatePathSummary', () => {
  it('derives the copy-deck paths for all three candidates', () => {
    const summaries = candidates.map(toCandidatePathSummary);
    expect(summaries[0]).toMatchObject({
      title: 'Grounded descent',
      romanNumeralPath: 'I held',
      displaySymbolPath: 'C',
      bassOutline: 'do — do',
    });
    expect(summaries[1]).toMatchObject({
      title: 'Strong arrival',
      romanNumeralPath: 'V7 → I',
      displaySymbolPath: 'G7 → C',
      bassOutline: 'sol → do',
    });
    expect(summaries[2]).toMatchObject({
      title: 'Keep moving',
      romanNumeralPath: 'I → I6',
      displaySymbolPath: 'C → C/E',
      bassOutline: 'do → mi',
    });
  });

  it('carries descriptor labels for card badges', () => {
    const summary = toCandidatePathSummary(candidates[1]);
    expect(summary.descriptorLabels).toEqual([
      'strong dominant arrival',
      'dominant pressure before release',
    ]);
  });
});

describe('getSelectedCandidate', () => {
  it('returns the selected candidate and follows selection changes', () => {
    const initial = createInitialWorkbenchState(fixture);
    expect(getSelectedCandidate(initial)?.id).toBe('grounded-descent');
    const state = workbenchReducer(initial, {
      type: 'SELECT_CANDIDATE',
      candidateId: 'keep-moving',
    });
    expect(getSelectedCandidate(state)?.id).toBe('keep-moving');
  });
});
