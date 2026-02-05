import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DrinkCard } from '../DrinkCard';
import type { DrinkSummary } from '../../../lib/globals/uiTypes';

describe('DrinkCard', () => {
  // Assumption: unnamed drinks must display a placeholder so users can still vote.
  it('shows a fallback name when drink name is missing', () => {
    const drink: DrinkSummary = {
      id: 'drink-1',
      name: null,
      creatorName: 'Team A',
    };

    render(<DrinkCard drink={drink} />);

    expect(screen.getByText('Unnamed Drink')).toBeTruthy();
  });

  // Assumption: vote variant should display totals when provided.
  it('renders vote totals in vote variant', () => {
    const drink: DrinkSummary = {
      id: 'drink-1',
      name: 'Sea Fog',
      creatorName: 'Team A',
    };

    render(
      <DrinkCard
        drink={drink}
        variant="vote"
        totals={[{ label: 'Overall', value: 8 }]}
      />
    );

    expect(screen.getByText('Overall')).toBeTruthy();
    expect(screen.getByText('8')).toBeTruthy();
  });
});
