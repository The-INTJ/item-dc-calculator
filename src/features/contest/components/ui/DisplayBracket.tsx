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

function DisplayMatchupCard({ matchup }: { matchup: DisplayMatchup }) {
  return (
    <article className="contest-display__matchup">
      <ContestantRow contestant={matchup.contestantA} />
      <ContestantRow contestant={matchup.contestantB} />
      {matchup.winnerId ? <span className="contest-display__badge">Leader</span> : null}
    </article>
  );
}

function DisplayRoundColumn({ round }: { round: DisplayRound }) {
  const roundClasses = [`contest-display__round`, `contest-display__round--${round.status}`];
  if (round.isActive) roundClasses.push('contest-display__round--active');

  return (
    <section className={roundClasses.join(' ')}>
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
          <DisplayMatchupCard key={matchup.id} matchup={matchup} />
        ))}
      </div>
    </section>
  );
}

export function DisplayBracket({ model }: DisplayBracketProps) {
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
      <div className="contest-display__grid" role="list">
        {model.rounds.length > 0 ? model.rounds.map((round) => (
          <div key={round.id} className="contest-display__column" role="listitem">
            <DisplayRoundColumn round={round} />
          </div>
        )) : <p className="contest-display__empty">No rounds have been created yet.</p>}
      </div>
    </section>
  );
}
