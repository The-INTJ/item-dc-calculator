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

function BracketRoundColumn({ round }: { round: BracketRound }) {
  return (
    <div className="contest-card contest-bracket__round-card">
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

export function BracketView({ rounds }: BracketViewProps) {
  return (
    <section className="contest-bracket">
      <div className="contest-bracket__mobile">
        <p className="contest-bracket__hint">Swipe to move between rounds.</p>
        <div className="contest-bracket__round-strip" role="list">
          {rounds.map((round) => (
            <div key={round.id} className="contest-bracket__round" role="listitem">
              <BracketRoundColumn round={round} />
            </div>
          ))}
        </div>
      </div>

      <div className="contest-bracket__desktop">
        <div className="contest-bracket__grid" role="list">
          {rounds.map((round) => (
            <div key={round.id} className="contest-bracket__column" role="listitem">
              <BracketRoundColumn round={round} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
