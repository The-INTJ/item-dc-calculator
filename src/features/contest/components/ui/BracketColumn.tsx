'use client';

import { getMatchupGridPlacement } from '@/contest/lib/domain/bracketMath';
import {
  getColumnHeaderLabel,
  getMatchupVisualState,
} from '@/contest/lib/presentation/bracketVisualState';
import type { ContestDisplaySurface } from '@/contest/lib/presentation/displaySurface';
import type {
  DisplayContestant,
  DisplayMatchup,
  DisplayRound,
} from '@/contest/lib/presentation/displayModel';
import { AnimatedScore } from './AnimatedScore';
import { MaterialSymbol } from './MaterialSymbol';
import { formatLabel } from './displayLabels';
import { useBumpOnChange } from './useBumpOnChange';

function ContestantRow({
  contestant,
  surface,
}: {
  contestant: DisplayContestant;
  surface: ContestDisplaySurface;
}) {
  const bumping = useBumpOnChange(contestant.scoreSignature);
  const classes = [
    'contest-display__team',
    contestant.isWinner ? 'contest-display__team--winner' : '',
    bumping ? 'contest-display__team--score-bump' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <MaterialSymbol
        name={surface.contestantIcon}
        className="contest-display__team-icon"
      />
      <span className="contest-display__name">{contestant.name}</span>
      <AnimatedScore score={contestant.score} signature={contestant.scoreSignature} />
    </div>
  );
}

function MatchupSparkles({ surface }: { surface: ContestDisplaySurface }) {
  return (
    <span className="contest-display__matchup-sparks" aria-hidden="true">
      {surface.sideIcons.slice(0, 3).map((icon, index) => (
        <MaterialSymbol
          key={`${icon}-${index}`}
          name={icon}
          className={`contest-display__matchup-spark contest-display__matchup-spark--${index + 1}`}
        />
      ))}
    </span>
  );
}

function BracketMatchupCard({
  matchup,
  round,
  gridRowCount,
  surface,
  onRef,
}: {
  matchup: DisplayMatchup;
  round: DisplayRound;
  gridRowCount: number;
  surface: ContestDisplaySurface;
  onRef: (key: string, el: HTMLElement | null) => void;
}) {
  const { rowStart, rowSpan } = getMatchupGridPlacement(
    round.roundIndex,
    matchup.slotIndex,
    gridRowCount,
  );
  const key = `${round.roundIndex}-${matchup.slotIndex}`;
  const scoreSignature = `${matchup.contestantA.scoreSignature}|${matchup.contestantB.scoreSignature}`;
  const bumping = useBumpOnChange(scoreSignature);
  const visualState = getMatchupVisualState(matchup, round.isActive);

  const classes = [
    'contest-display__matchup',
    visualState === 'live' ? 'contest-display__matchup--active' : '',
    visualState === 'bye' ? 'contest-display__matchup--bye' : '',
    visualState === 'tbd' ? 'contest-display__matchup--tbd' : '',
    bumping ? 'contest-display__matchup--score-bump' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article
      className={classes}
      style={{
        gridRow: `${rowStart} / span ${rowSpan}`,
      }}
      ref={(el) => onRef(key, el)}
      data-matchup-key={key}
      data-phase={matchup.phase ?? 'empty'}
      data-bye={matchup.isBye || undefined}
    >
      <MatchupSparkles surface={surface} />
      <ContestantRow contestant={matchup.contestantA} surface={surface} />
      {matchup.isBye ? (
        <p className="contest-display__bye-label">Bye — auto-advances</p>
      ) : (
        <ContestantRow contestant={matchup.contestantB} surface={surface} />
      )}
      {matchup.winnerId && !matchup.isBye ? (
        <span className="contest-display__badge">Leader</span>
      ) : null}
    </article>
  );
}

export function BracketColumn({
  round,
  gridRowCount,
  surface,
  onMatchupRef,
}: {
  round: DisplayRound;
  gridRowCount: number;
  surface: ContestDisplaySurface;
  onMatchupRef: (key: string, el: HTMLElement | null) => void;
}) {
  const classes = ['contest-display__column'];
  if (round.isActive) classes.push('contest-display__column--active');

  return (
    <section
      className={classes.join(' ')}
      aria-label={round.name}
      data-round-index={round.roundIndex}
    >
      <header className="contest-display__column-header">
        <p className="contest-display__label">{getColumnHeaderLabel(round)}</p>
        <h2 className="contest-display__column-title">{round.name}</h2>
        <span className={`contest-display__status contest-display__status--${round.status}`}>
          {formatLabel(round.status)}
        </span>
      </header>
      <div
        className="contest-display__column-grid"
        style={{
          gridTemplateRows: `repeat(${Math.max(gridRowCount, 2)}, minmax(0, 1fr))`,
        }}
      >
        {round.matchups.map((matchup) => (
          <BracketMatchupCard
            key={matchup.id}
            matchup={matchup}
            round={round}
            gridRowCount={gridRowCount}
            surface={surface}
            onRef={onMatchupRef}
          />
        ))}
      </div>
    </section>
  );
}
