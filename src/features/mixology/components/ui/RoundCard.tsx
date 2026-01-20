import React from 'react';
import type { RoundSummary } from '../../types/uiTypes';

type RoundCardVariant = 'compact' | 'detailed';

interface RoundCardProps {
  round: RoundSummary;
  variant?: RoundCardVariant;
  onClick?: () => void;
  className?: string;
}

function getStatusLabel(status: RoundSummary['status']) {
  if (status === 'active') return 'Active';
  if (status === 'closed') return 'Closed';
  return 'Upcoming';
}

export function RoundCard({ round, variant = 'compact', onClick, className }: RoundCardProps) {
  const Container = onClick ? 'button' : 'div';
  const label = getStatusLabel(round.status);

  return (
    <Container
      type={onClick ? 'button' : undefined}
      className={`mixology-card mixology-round-card mixology-round-card--${variant} ${className ?? ''}`.trim()}
      onClick={onClick}
    >
      <header className="mixology-round-card__header">
        <div>
          <p className="mixology-round-card__eyebrow">Round</p>
          <h3 className="mixology-round-card__title">{round.name}</h3>
        </div>
        <span className="mixology-round-card__status">{label}</span>
      </header>

      {variant === 'detailed' && (
        <p className="mixology-round-card__meta">Matchups: {round.matchupCount}</p>
      )}

      <ul className="mixology-round-card__contestants">
        {round.contestantNames.length === 0 ? (
          <li className="mixology-round-card__empty">No contestants yet</li>
        ) : (
          round.contestantNames.map((name) => <li key={name}>{name}</li>)
        )}
      </ul>
    </Container>
  );
}