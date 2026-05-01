import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Contest, Matchup } from '../../contexts/contest/contestTypes';
import { buildDisplayModel } from '../../lib/presentation/displayModel';
import { DisplayBracket } from './DisplayBracket';

const mixologyConfig = {
  topic: 'Mixology',
  entryLabel: 'Drink',
  entryLabelPlural: 'Drinks',
  contestantLabel: 'Mixologist',
  contestantLabelPlural: 'Mixologists',
  attributes: [],
};

function makeContest(scoreA = 8): Contest {
  return {
    id: 'contest-tv',
    name: 'TV Bar Finals',
    slug: 'tv-bar-finals',
    config: mixologyConfig,
    rounds: [{ id: 'r1', name: 'Final Round' }],
    entries: [
      {
        id: 'e1',
        name: 'Hymalayan Fizz',
        slug: 'hymalayan-fizz',
        description: '',
        submittedBy: 'A',
        sumScore: scoreA,
        voteCount: 1,
      },
      {
        id: 'e2',
        name: 'Pretty Green Wall',
        slug: 'pretty-green-wall',
        description: '',
        submittedBy: 'B',
        sumScore: 4,
        voteCount: 1,
      },
    ],
    voters: [],
  };
}

function makeMatchups(phase: Matchup['phase']): Matchup[] {
  return [
    {
      id: 'm-1',
      contestId: 'contest-tv',
      roundId: 'r1',
      slotIndex: 0,
      entryIds: ['e1', 'e2'],
      phase,
    },
  ];
}

afterEach(() => {
  vi.useRealTimers();
});

describe('DisplayBracket', () => {
  it('renders the mixology active surface when a matchup is shaking', () => {
    render(<DisplayBracket model={buildDisplayModel(makeContest(), makeMatchups('shake'))} />);

    expect(screen.getByText('Now Shaking')).toBeTruthy();
    expect(screen.getByText('Game 1 is active')).toBeTruthy();
    expect(screen.getByText('Pour feed')).toBeTruthy();
  });

  it('renders standby copy when no matchup is in shake mode', () => {
    render(<DisplayBracket model={buildDisplayModel(makeContest(), makeMatchups('set'))} />);

    expect(screen.getAllByText('No game is currently in shake mode').length).toBeGreaterThan(0);
    expect(screen.getByText(/Next look: Hymalayan Fizz vs Pretty Green Wall/)).toBeTruthy();
  });

  it('ticks an updated score and shows the flying delta', () => {
    vi.useFakeTimers();
    const initialModel = buildDisplayModel(makeContest(8), makeMatchups('shake'));
    const { rerender } = render(<DisplayBracket model={initialModel} />);

    expect(screen.getAllByText('8').length).toBeGreaterThan(0);

    const updatedModel = buildDisplayModel(makeContest(10), makeMatchups('shake'));
    rerender(<DisplayBracket model={updatedModel} />);

    expect(screen.getByText('+2')).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(screen.getAllByText('10').length).toBeGreaterThan(0);
  });
});
