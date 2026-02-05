import { Slider } from '@mui/material';
import type { VoteCategory } from '../../contexts/contest/contestTypes';
import type { DrinkSummary, VoteTotals } from '../../lib/helpers/uiMappings';
import { DrinkCard } from './DrinkCard';

interface VoteScorePanelProps {
  drinks: DrinkSummary[];
  categories: VoteCategory[];
  totals: VoteTotals[];
  scoreByDrinkId?: Record<string, Record<string, number>>;
  onScoreChange?: (drinkId: string, categoryId: string, value: number) => void;
  showCreator?: boolean;
  className?: string;
  emptyLabel?: string;
  /** When true, sliders are disabled and greyed out */
  disabled?: boolean;
}

export function VoteScorePanel({
  drinks,
  categories,
  totals,
  scoreByDrinkId,
  onScoreChange,
  showCreator = true,
  className,
  emptyLabel = 'No drinks submitted yet.',
  disabled = false,
}: VoteScorePanelProps) {
  if (categories.length === 0) {
    return <div className="mixology-empty">No categories yet.</div>;
  }

  if (drinks.length === 0) {
    return <div className="mixology-empty">{emptyLabel}</div>;
  }

  return (
    <div className={`mixology-vote-scores ${disabled ? 'mixology-vote-scores--disabled' : ''} ${className ?? ''}`.trim()}>
      {drinks.map((drink) => {
        const drinkTotals = categories.map((category) => {
          const total = totals.find(
            (entry) => entry.entryId === drink.id && entry.categoryId === category.id
          )?.total;
          return {
            label: category.label,
            value: total ?? 0,
          };
        });
        return (
          <DrinkCard
            key={drink.id}
            drink={drink}
            variant="vote"
            showCreator={showCreator}
            totals={drinkTotals}
          >
            {onScoreChange && !disabled && (
              <div className="mixology-vote-inputs">
                {categories.map((category) => {
                  const value = scoreByDrinkId?.[drink.id]?.[category.id] ?? 5;
                  return (
                    <div key={category.id} className="mixology-vote-slider">
                      <div className="mixology-vote-slider__label-row">
                        <label className="mixology-vote-slider__label" htmlFor={`score-${drink.id}-${category.id}`}>
                          {category.label}
                        </label>
                        <span className="mixology-vote-slider__value">{value}</span>
                      </div>
                      <Slider
                        id={`score-${drink.id}-${category.id}`}
                        className="mixology-vote-slider__field"
                        min={1}
                        max={10}
                        step={1}
                        value={value}
                        valueLabelDisplay="auto"
                        onChange={(_, nextValue) => {
                          const normalized = Array.isArray(nextValue) ? nextValue[0] : nextValue;
                          onScoreChange(drink.id, category.id, normalized);
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </DrinkCard>
        );
      })}
    </div>
  );
}
