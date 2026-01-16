import type { DrinkSummary, VoteTotals } from '../data/uiTypes';
import { DrinkCard } from './DrinkCard';

interface VoteScorePanelProps {
  drinks: DrinkSummary[];
  totals: VoteTotals[];
  activeCategoryId: string | null;
  activeCategoryLabel?: string;
  scoreByDrinkId?: Record<string, number>;
  onScoreChange?: (drinkId: string, value: number) => void;
  showCreator?: boolean;
  className?: string;
  emptyLabel?: string;
}

export function VoteScorePanel({
  drinks,
  totals,
  activeCategoryId,
  activeCategoryLabel,
  scoreByDrinkId,
  onScoreChange,
  showCreator = true,
  className,
  emptyLabel = 'No drinks submitted yet.',
}: VoteScorePanelProps) {
  if (!activeCategoryId) {
    return <div className="mixology-empty">No categories yet.</div>;
  }

  if (drinks.length === 0) {
    return <div className="mixology-empty">{emptyLabel}</div>;
  }

  const totalMap = new Map(
    totals
      .filter((total) => total.categoryId === activeCategoryId)
      .map((total) => [total.drinkId, total.total])
  );

  const label = activeCategoryLabel ?? 'Total';

  return (
    <div className={`mixology-vote-scores ${className ?? ''}`.trim()}>
      {drinks.map((drink) => (
        <DrinkCard
          key={drink.id}
          drink={drink}
          variant="vote"
          showCreator={showCreator}
          totals={[{ label, value: totalMap.get(drink.id) ?? 0 }]}
        >
          {onScoreChange && (
            <div className="mixology-vote-input">
              <label className="mixology-vote-input__label" htmlFor={`score-${drink.id}`}>
                {activeCategoryLabel ?? 'Score'}
              </label>
              <input
                id={`score-${drink.id}`}
                className="mixology-vote-input__field"
                type="number"
                min={0}
                max={10}
                step={1}
                value={scoreByDrinkId?.[drink.id] ?? ''}
                onChange={(event) => onScoreChange(drink.id, Number(event.target.value))}
              />
            </div>
          )}
        </DrinkCard>
      ))}
    </div>
  );
}
