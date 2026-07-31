'use client';

import { Button } from '@/components/ui';
import type {
  BracketContestant,
  BracketMatchup,
} from '@/contest/lib/presentation/buildBracketRoundsFromContest';

function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return '—';
  return String(score);
}

function MatchupRow({ contestant, winnerId }: { contestant: BracketContestant; winnerId: string | null | undefined }) {
  const isWinner = Boolean(winnerId && contestant.id === winnerId);
  const className = isWinner
    ? 'contest-rounds__matchup-row contest-rounds__matchup-row--winner'
    : 'contest-rounds__matchup-row';

  return (
    <div className={className}>
      <p className="contest-rounds__matchup-name">{contestant.name}</p>
      <span className="contest-rounds__matchup-score">{formatScore(contestant.score ?? null)}</span>
    </div>
  );
}

function matchupLabel(matchup: BracketMatchup): string {
  if (matchup.isBye) return matchup.contestantA.name;
  return `${matchup.contestantA.name} vs ${matchup.contestantB.name}`;
}

export function HeroMatchup({
  matchup,
  index,
  hasVoted,
  votable,
  onVote,
}: {
  matchup: BracketMatchup;
  index: number;
  hasVoted: boolean;
  /** True when this matchup is open (shake) and its round isn't closed. */
  votable: boolean;
  onVote: (matchupId: string) => void;
}) {
  const matchupNumber = index + 1;
  const label = matchupLabel(matchup);

  if (matchup.isBye) {
    return (
      <li
        className="contest-rounds__matchup contest-rounds__matchup--bye"
        aria-label={`Matchup ${matchupNumber}: ${label}`}
      >
        <MatchupRow contestant={matchup.contestantA} winnerId={matchup.winnerId} />
        <p className="contest-rounds__bye-label">Bye — auto-advances</p>
      </li>
    );
  }
  return (
    <li className="contest-rounds__matchup" aria-label={`Matchup ${matchupNumber}: ${label}`}>
      <MatchupRow contestant={matchup.contestantA} winnerId={matchup.winnerId} />
      <MatchupRow contestant={matchup.contestantB} winnerId={matchup.winnerId} />
      {hasVoted && <span className="contest-rounds__matchup-voted">Voted</span>}
      {votable && matchup.matchupId && (
        <Button
          variant="accent"
          block
          className="contest-rounds__vote-cta"
          aria-label={`Vote matchup ${matchupNumber}: ${label}`}
          onClick={() => onVote(matchup.matchupId!)}
        >
          {hasVoted ? 'Change vote' : 'Vote this matchup'}
        </Button>
      )}
    </li>
  );
}
