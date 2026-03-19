import React from 'react';
import { buildBracketLayout } from '@/contest/lib/presentation/bracketLayout';

type BracketRoundStatus = 'upcoming' | 'active' | 'closed';

type BracketContestant = {
  id: string;
  name: string;
  score?: number | null;
};

type BracketMatchup = {
  id: string;
  contestantA: BracketContestant;
  contestantB: BracketContestant;
  winnerId?: string | null;
};

export type BracketRound = {
  id: string;
  name: string;
  status: BracketRoundStatus;
  matchups: BracketMatchup[];
};

interface BracketViewProps {
  rounds: BracketRound[];
  onRoundClick?: (roundId: string) => void;
}

function formatRoundStatus(status: BracketRoundStatus) {
  if (status === 'active') return 'Active';
  if (status === 'closed') return 'Closed';
  return 'Upcoming';
}

function MatchupRow({ contestant, winnerId }: { contestant: BracketContestant; winnerId?: string | null }) {
  const isWinner = Boolean(winnerId && contestant.id === winnerId);
  const score = contestant.score ?? '—';

  return (
    <div
      className={`contest-matchup-card__team ${isWinner ? 'contest-matchup-card__team--winner' : ''}`.trim()}
    >
      <p className="contest-matchup-card__name">{contestant.name}</p>
      <span className="contest-matchup-card__score">{score}</span>
    </div>
  );
}

function MatchupCard({ matchup }: { matchup: BracketMatchup }) {
  return (
    <div className="contest-card contest-matchup-card">
      <MatchupRow contestant={matchup.contestantA} winnerId={matchup.winnerId} />
      <MatchupRow contestant={matchup.contestantB} winnerId={matchup.winnerId} />
      {matchup.winnerId && <span className="contest-matchup-card__badge">Winner decided</span>}
    </div>
  );
}

function BracketRoundColumn({ round, onClick }: { round: BracketRound; onClick?: () => void }) {
  const clickableClass = onClick ? 'contest-bracket__round-card--clickable' : '';

  return (
    <div
      className={`contest-card contest-bracket__round-card ${clickableClass}`.trim()}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      <header className="contest-bracket__round-header">
        <h3 className="contest-bracket__round-title">{round.name}</h3>
        <span className="contest-bracket__round-status">{formatRoundStatus(round.status)}</span>
      </header>
      <div className="contest-bracket__matchups">
        {round.matchups.map((matchup) => (
          <MatchupCard key={matchup.id} matchup={matchup} />
        ))}
      </div>
    </div>
  );
}

function FaceOffContestant({ contestant, winnerId }: { contestant: BracketContestant; winnerId?: string | null }) {
  const isWinner = Boolean(winnerId && contestant.id === winnerId);
  const score = contestant.score ?? '—';

  return (
    <div className={`contest-face-off__contestant${isWinner ? ' contest-face-off__contestant--leader' : ''}`}>
      <p className="contest-face-off__name">{contestant.name}</p>
      <span className="contest-face-off__score">{score}</span>
    </div>
  );
}

function FaceOffView({ round, onClick }: { round: BracketRound; onClick?: () => void }) {
  const matchup = round.matchups[0];

  return (
    <section
      className={`contest-face-off${onClick ? ' contest-face-off--clickable' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      <header className="contest-face-off__header">
        <h3 className="contest-face-off__title">{round.name}</h3>
        <span className="contest-face-off__status">{formatRoundStatus(round.status)}</span>
      </header>
      {matchup ? (
        <div className="contest-face-off__matchup">
          <FaceOffContestant contestant={matchup.contestantA} winnerId={matchup.winnerId} />
          <span className="contest-face-off__vs">VS</span>
          <FaceOffContestant contestant={matchup.contestantB} winnerId={matchup.winnerId} />
        </div>
      ) : (
        <p className="contest-face-off__empty">No matchup in this round yet.</p>
      )}
    </section>
  );
}

function BracketGrid({ rounds, onRoundClick }: BracketViewProps) {
  return (
    <>
      <div className="contest-bracket__mobile">
        <p className="contest-bracket__hint">Swipe to move between rounds.</p>
        <div className="contest-bracket__round-strip" role="list">
          {rounds.map((round) => (
            <div key={round.id} className="contest-bracket__round" role="listitem">
              <BracketRoundColumn round={round} onClick={onRoundClick ? () => onRoundClick(round.id) : undefined} />
            </div>
          ))}
        </div>
      </div>

      <div className="contest-bracket__desktop">
        <div className="contest-bracket__grid" role="list">
          {rounds.map((round) => (
            <div key={round.id} className="contest-bracket__column" role="listitem">
              <BracketRoundColumn round={round} onClick={onRoundClick ? () => onRoundClick(round.id) : undefined} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export function BracketView({ rounds, onRoundClick }: BracketViewProps) {
  const layout = buildBracketLayout(rounds);

  return (
    <section className="contest-bracket">
      {layout.kind === 'face-off' && layout.finalRound ? (
        <FaceOffView
          round={layout.finalRound}
          onClick={onRoundClick ? () => onRoundClick(layout.finalRound!.id) : undefined}
        />
      ) : (
        <BracketGrid rounds={rounds} onRoundClick={onRoundClick} />
      )}
    </section>
  );
}
