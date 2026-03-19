import Link from 'next/link';
import type {
  DisplayContestant,
  DisplayMatchup,
  DisplayModel,
  DisplayRound,
} from '@/contest/lib/presentation/displayModel';

interface DisplayBracketProps {
  model: DisplayModel;
}

function formatLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatScore(score: number | null) {
  return score === null ? '-' : String(score);
}

function ContestantRow({ contestant }: { contestant: DisplayContestant }) {
  const winnerClass = contestant.isWinner ? ' contest-display__team--winner' : '';

  return (
    <div className={`contest-display__team${winnerClass}`}>
      <span className="contest-display__name">{contestant.name}</span>
      <span className="contest-display__score">{formatScore(contestant.score)}</span>
    </div>
  );
}

function DisplayMatchupCard({ matchup, showConnector }: { matchup: DisplayMatchup; showConnector: boolean }) {
  return (
    <article className={`contest-display__matchup${showConnector ? ' contest-display__matchup--connected' : ''}`}>
      <ContestantRow contestant={matchup.contestantA} />
      <ContestantRow contestant={matchup.contestantB} />
      {matchup.winnerId ? <span className="contest-display__badge">Leader</span> : null}
    </article>
  );
}

function BracketRoundColumn({ round }: { round: DisplayRound }) {
  const roundClasses = [`contest-display__round`, `contest-display__round--${round.status}`];
  if (round.isActive) roundClasses.push('contest-display__round--active');

  return (
    <section className={roundClasses.join(' ')} style={{ '--round-index': round.roundIndex } as React.CSSProperties}>
      <header className="contest-display__round-header">
        <div>
          <p className="contest-display__label">{round.isActive ? 'Now Playing' : 'Round'}</p>
          <h2 className="contest-display__round-title">{round.name}</h2>
        </div>
        <span className={`contest-display__status contest-display__status--${round.status}`}>
          {formatLabel(round.status)}
        </span>
      </header>
      <div className="contest-display__matchups">
        {round.matchups.map((matchup) => (
          <DisplayMatchupCard key={matchup.id} matchup={matchup} showConnector={round.roundIndex > 0} />
        ))}
      </div>
    </section>
  );
}

function FaceOffContestant({ contestant }: { contestant: DisplayContestant }) {
  return (
    <div className={`contest-display__fo-contestant${contestant.isWinner ? ' contest-display__fo-contestant--leader' : ''}`}>
      <p className="contest-display__fo-name">{contestant.name}</p>
      <span className="contest-display__fo-score">{formatScore(contestant.score)}</span>
    </div>
  );
}

function DisplayFaceOff({ round }: { round: DisplayRound }) {
  const matchup = round.matchups[0];

  return (
    <section className="contest-display__face-off">
      <header className="contest-display__fo-header">
        <p className="contest-display__label">Final Round</p>
        <h2 className="contest-display__fo-title">{round.name}</h2>
        <span className={`contest-display__status contest-display__status--${round.status}`}>
          {formatLabel(round.status)}
        </span>
      </header>
      {matchup ? (
        <div className="contest-display__fo-matchup">
          <FaceOffContestant contestant={matchup.contestantA} />
          <span className="contest-display__fo-vs">VS</span>
          <FaceOffContestant contestant={matchup.contestantB} />
        </div>
      ) : (
        <p className="contest-display__empty">Waiting for finalists...</p>
      )}
    </section>
  );
}

function BracketGrid({ rounds }: { rounds: DisplayRound[] }) {
  const totalRounds = rounds.length;

  return (
    <div
      className="contest-display__bracket"
      style={{ '--total-rounds': totalRounds } as React.CSSProperties}
      role="list"
    >
      {rounds.map((round) => (
        <div key={round.id} className="contest-display__bracket-col" role="listitem">
          <BracketRoundColumn round={round} />
        </div>
      ))}
    </div>
  );
}

export function DisplayBracket({ model }: DisplayBracketProps) {
  const bracketRounds = model.isFinalRoundActive
    ? model.rounds.slice(0, -1)
    : model.rounds;
  const faceOffRound = model.isFinalRoundActive
    ? model.rounds[model.rounds.length - 1]
    : null;

  return (
    <section className="contest-display">
      <header className="contest-display__hero">
        <div>
          <Link href={`/contest/${model.contestId}`} className="contest-display__eyebrow contest-display__eyebrow--link">Display Mode</Link>
          <h1 className="contest-display__title">{model.contestName}</h1>
          <p className="contest-display__meta">{formatLabel(model.phase)} phase - {model.totalRounds} rounds - Live updates</p>
        </div>
        <div className="contest-display__ticker">
          <section className="contest-display__panel">
            <span className="contest-display__label">Now Playing</span>
            <strong className="contest-display__value">{model.activeRoundName ?? 'Waiting for active round'}</strong>
          </section>
          <section className="contest-display__panel">
            <span className="contest-display__label">Up Next</span>
            <strong className="contest-display__value">{model.nextRoundName ?? 'No next round queued'}</strong>
          </section>
        </div>
      </header>

      {model.rounds.length > 0 ? (
        <>
          {bracketRounds.length > 0 && <BracketGrid rounds={bracketRounds} />}
          {faceOffRound && <DisplayFaceOff round={faceOffRound} />}
        </>
      ) : (
        <p className="contest-display__empty">No rounds have been created yet.</p>
      )}
    </section>
  );
}
