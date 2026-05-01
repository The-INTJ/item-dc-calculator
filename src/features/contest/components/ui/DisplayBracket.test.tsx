import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Contest, Entry, Matchup } from '../../contexts/contest/contestTypes';
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

function makeContest(): Contest {
  return {
    id: 'contest-tv',
    name: 'TV Bar Finals',
    slug: 'tv-bar-finals',
    config: mixologyConfig,
    rounds: [{ id: 'r1', name: 'Final Round' }],
    contestants: [
      { id: 'cA', displayName: 'A' },
      { id: 'cB', displayName: 'B' },
    ],
    voters: [],
  };
}

function entry(
  id: string,
  contestantId: string,
  name: string,
  sumScore: number,
  voteCount = 1,
): Entry {
  return { id, contestantId, matchupId: 'm-1', name, sumScore, voteCount };
}

function makeMatchups(phase: Matchup['phase'], scoreA = 8): Matchup[] {
  return [
    {
      id: 'm-1',
      contestId: 'contest-tv',
      roundId: 'r1',
      slotIndex: 0,
      entries: [
        entry('e1', 'cA', 'Hymalayan Fizz', scoreA),
        entry('e2', 'cB', 'Pretty Green Wall', 4),
      ],
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
    expect(screen.getByText(/Next look: Hymalayan Fizz.*vs Pretty Green Wall/)).toBeTruthy();
  });

  it('ticks an updated score and shows the flying delta', () => {
    vi.useFakeTimers();
    const initialModel = buildDisplayModel(makeContest(), makeMatchups('shake', 8));
    const { rerender } = render(<DisplayBracket model={initialModel} />);

    expect(screen.getAllByText('8').length).toBeGreaterThan(0);

    const updatedModel = buildDisplayModel(makeContest(), makeMatchups('shake', 10));
    rerender(<DisplayBracket model={updatedModel} />);

    expect(screen.getByText('+2')).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(screen.getAllByText('10').length).toBeGreaterThan(0);
  });
});
