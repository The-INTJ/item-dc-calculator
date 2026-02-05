import React from 'react';
import type { ReactNode } from 'react';
import type { EntrySummary } from '../../lib/helpers/uiMappings';

type EntryCardVariant = 'compact' | 'vote';

interface EntryTotal {
  label: string;
  value: number;
}

interface EntryCardProps {
  entry: EntrySummary;
  variant?: EntryCardVariant;
  showCreator?: boolean;
  totals?: EntryTotal[];
  className?: string;
  children?: ReactNode;
}

export function EntryCard({
  entry,
  variant = 'compact',
  showCreator = true,
  totals = [],
  className,
  children,
}: EntryCardProps) {
  const name = entry.name ?? 'Unnamed Entry';

  return (
    <div className={`mixology-card mixology-entry-card mixology-entry-card--${variant} ${className ?? ''}`.trim()}>
      <header className="mixology-entry-card__header">
        <h3 className="mixology-entry-card__title">{name}</h3>
        {showCreator && <p className="mixology-entry-card__creator">by {entry.creatorName}</p>}
      </header>

      {variant === 'vote' && totals.length > 0 && (
        <ul className="mixology-entry-card__totals">
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
