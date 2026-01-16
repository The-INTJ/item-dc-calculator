import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RoundCard } from '../RoundCard';
import type { RoundSummary } from '../../data/uiTypes';

describe('RoundCard', () => {
  // Assumption: round cards must always display the round name and status label.
  it('renders round name and status', () => {
    const round: RoundSummary = {
      id: 'round-1',
      name: 'Round of 8',
      number: 1,
      status: 'active',
      matchupCount: 4,
      contestantNames: ['Team A', 'Team B'],
    };

    render(<RoundCard round={round} />);

    expect(screen.getByText('Round of 8')).toBeTruthy();
    expect(screen.getByText('Active')).toBeTruthy();
  });

  // Assumption: compact variant should hide matchup count to keep cards terse.
  it('hides matchup count in compact variant', () => {
    const round: RoundSummary = {
      id: 'round-1',
      name: 'Quarterfinals',
      number: 1,
      status: 'upcoming',
      matchupCount: 4,
      contestantNames: [],
    };

    render(<RoundCard round={round} variant="compact" />);

    expect(screen.queryByText(/Matchups:/)).toBeNull();
  });
});
