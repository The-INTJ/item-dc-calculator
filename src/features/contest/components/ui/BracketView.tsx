import React from 'react';

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
      className={`mixology-matchup-card__team ${isWinner ? 'mixology-matchup-card__team--winner' : ''}`.trim()}
    >
      <p className="mixology-matchup-card__name">{contestant.name}</p>
      <span className="mixology-matchup-card__score">{score}</span>
    </div>
  );
}

function MatchupCard({ matchup }: { matchup: BracketMatchup }) {
  return (
    <div className="mixology-card mixology-matchup-card">
      <MatchupRow contestant={matchup.contestantA} winnerId={matchup.winnerId} />
      <MatchupRow contestant={matchup.contestantB} winnerId={matchup.winnerId} />
      {matchup.winnerId && <span className="mixology-matchup-card__badge">Winner decided</span>}
    </div>
  );
}

function BracketRoundColumn({ round }: { round: BracketRound }) {
  return (
    <div className="mixology-card mixology-bracket__round-card">
      <header className="mixology-bracket__round-header">
        <h3 className="mixology-bracket__round-title">{round.name}</h3>
        <span className="mixology-bracket__round-status">{formatRoundStatus(round.status)}</span>
      </header>
      <div className="mixology-bracket__matchups">
        {round.matchups.map((matchup) => (
          <MatchupCard key={matchup.id} matchup={matchup} />
        ))}
      </div>
    </div>
  );
}

export function BracketView({ rounds }: BracketViewProps) {
  return (
    <section className="mixology-bracket">
      <div className="mixology-bracket__mobile">
        <p className="mixology-bracket__hint">Swipe to move between rounds.</p>
        <div className="mixology-bracket__round-strip" role="list">
          {rounds.map((round) => (
            <div key={round.id} className="mixology-bracket__round" role="listitem">
              <BracketRoundColumn round={round} />
            </div>
          ))}
        </div>
      </div>

      <div className="mixology-bracket__desktop">
        <div className="mixology-bracket__grid" role="list">
          {rounds.map((round) => (
            <div key={round.id} className="mixology-bracket__column" role="listitem">
              <BracketRoundColumn round={round} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
