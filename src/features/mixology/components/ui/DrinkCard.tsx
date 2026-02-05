import React from 'react';
import type { DrinkSummary } from '../../lib/globals/uiTypes';
import type { ReactNode } from 'react';

type DrinkCardVariant = 'compact' | 'vote';

interface DrinkTotal {
  label: string;
  value: number;
}

interface DrinkCardProps {
  drink: DrinkSummary;
  variant?: DrinkCardVariant;
  showCreator?: boolean;
  totals?: DrinkTotal[];
  className?: string;
  children?: ReactNode;
}

export function DrinkCard({
  drink,
  variant = 'compact',
  showCreator = true,
  totals = [],
  className,
  children,
}: DrinkCardProps) {
  const name = drink.name ?? 'Unnamed Drink';

  return (
    <div className={`mixology-card mixology-drink-card mixology-drink-card--${variant} ${className ?? ''}`.trim()}>
      <header className="mixology-drink-card__header">
        <h3 className="mixology-drink-card__title">{name}</h3>
        {showCreator && <p className="mixology-drink-card__creator">by {drink.creatorName}</p>}
      </header>

      {variant === 'vote' && totals.length > 0 && (
        <ul className="mixology-drink-card__totals">
          {totals.map((total) => (
            <li key={total.label}>
              <span>{total.label}</span>
              <strong>{total.value}</strong>
            </li>
          ))}
        </ul>
      )}

      {children}
    </div>
  );
}