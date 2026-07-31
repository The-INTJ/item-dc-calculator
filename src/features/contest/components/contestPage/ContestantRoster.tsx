'use client';

import type { Contest } from '../../contexts/contest/contestTypes';

interface ContestantRosterProps {
  contest: Contest;
  contestantLabel: string;
}

/** A first look at who is competing — capped, since the bracket is the real view. */
export function ContestantRoster({ contest, contestantLabel }: ContestantRosterProps) {
  const contestantCount = contest.contestants?.length ?? 0;

  return (
    <section className="contest-entry-preview" aria-label={`${contestantLabel} preview`}>
      <div className="contest-entry-preview__header">
        <h2>{contestantCount === 1 ? contestantLabel : `${contestantLabel}s`}</h2>
        <span className="muted">{contestantCount}</span>
      </div>
      {contest.contestants.length === 0 ? (
        <p className="contest-empty">No {contestantLabel.toLowerCase()}s have registered yet.</p>
      ) : (
        <div className="contest-entry-preview__list">
          {contest.contestants.slice(0, 6).map((c) => (
            <div key={c.id} className="contest-entry-row">
              <span className="contest-entry-row__image" aria-hidden="true" />
              <span className="contest-entry-row__body">
                <strong>{c.displayName}</strong>
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
