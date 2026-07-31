'use client';

import { Button } from '@/components/ui';
import type { Contest } from '../../contexts/contest/contestTypes';
import { MaterialSymbol } from '../ui/MaterialSymbol';
import { MatchupEntryEditor } from './MatchupEntryEditor';
import { participationLabel, type ParticipantDetails } from './participantDetails';

function ContestantCardBody({
  participant,
  rounds,
  onSetEntryName,
  onRemoveContestant,
}: {
  participant: ParticipantDetails;
  rounds: Contest['rounds'];
  onSetEntryName: (matchupId: string, entryId: string, name: string) => Promise<boolean>;
  onRemoveContestant: (() => void) | null;
}) {
  return (
    <div className="admin-participant-card__body">
      <section className="admin-participant-section">
        <header className="admin-participant-section__header">
          <h4>Per-matchup entries</h4>
        </header>
        {participant.entries.length === 0 ? (
          <p className="admin-empty">Not placed in any matchups yet.</p>
        ) : (
          <ul className="admin-entry-list">
            {participant.entries.map(({ matchup, entry, roundIndex }) => (
              <MatchupEntryEditor
                key={entry.id}
                matchup={matchup}
                entry={entry}
                roundLabel={rounds?.[roundIndex]?.name || `Round ${roundIndex + 1}`}
                onSubmit={(name) => onSetEntryName(matchup.id, entry.id, name)}
              />
            ))}
          </ul>
        )}
      </section>

      {onRemoveContestant && (
        <div className="admin-entry-add">
          <Button variant="danger" onClick={onRemoveContestant}>
            Remove contestant
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Expandable card for one participant: badges, participation summary, and
 * (when expanded) per-matchup entry editors plus contestant removal.
 */
export function ContestantCard({
  participant,
  rounds,
  expanded,
  onToggle,
  onSetEntryName,
  onRemoveContestant,
}: {
  participant: ParticipantDetails;
  rounds: Contest['rounds'];
  expanded: boolean;
  onToggle: () => void;
  onSetEntryName: (matchupId: string, entryId: string, name: string) => Promise<boolean>;
  onRemoveContestant: (() => void) | null;
}) {
  const namedCount = participant.entries.filter((e) => e.entry.name?.trim()).length;
  const placementSummary =
    participant.entries.length === 0
      ? 'Not placed yet'
      : `${namedCount}/${participant.entries.length} entries named`;

  return (
    <li className={`admin-participant-card${expanded ? ' admin-participant-card--expanded' : ''}`}>
      <button
        type="button"
        className="admin-participant-card__header"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <div className="admin-participant-card__identity">
          <strong className="admin-participant-card__name">{participant.displayName}</strong>
          <div className="admin-participant-card__badges">
            <span className={`admin-role-badge admin-role-badge--${participant.role}`}>
              {participant.role}
            </span>
            {participant.contestantId && (
              <span className="admin-role-badge admin-role-badge--contestant">contestant</span>
            )}
          </div>
        </div>
        <div className="admin-participant-card__summary">
          <span className="admin-detail-meta">{participationLabel(participant)}</span>
          <span className="admin-detail-meta">{placementSummary}</span>
          <MaterialSymbol
            name={expanded ? 'expand_less' : 'expand_more'}
            className="admin-participant-card__chevron"
          />
        </div>
      </button>

      {expanded && (
        <ContestantCardBody
          participant={participant}
          rounds={rounds}
          onSetEntryName={onSetEntryName}
          onRemoveContestant={onRemoveContestant}
        />
      )}
    </li>
  );
}
