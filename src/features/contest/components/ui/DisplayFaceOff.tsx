'use client';

import type { ContestDisplaySurface } from '@/contest/lib/presentation/displaySurface';
import type {
  DisplayContestant,
  DisplayMatchup,
  DisplayModel,
} from '@/contest/lib/presentation/displayModel';
import { AnimatedScore } from './AnimatedScore';
import { MaterialSymbol } from './MaterialSymbol';
import { useBumpOnChange } from './useBumpOnChange';

function FaceOffContestant({
  contestant,
  surface,
  side,
}: {
  contestant: DisplayContestant;
  surface: ContestDisplaySurface;
  side: 'left' | 'right';
}) {
  const bumping = useBumpOnChange(contestant.scoreSignature);
  const classes = [
    'contest-display__fo-contestant',
    `contest-display__fo-contestant--${side}`,
    contestant.isWinner ? 'contest-display__fo-contestant--leader' : '',
    bumping ? 'contest-display__fo-contestant--score-bump' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <div className="contest-display__fo-orbit" aria-hidden="true">
        {surface.sideIcons.slice(side === 'left' ? 0 : 2, side === 'left' ? 4 : 6).map((icon) => (
          <MaterialSymbol key={icon} name={icon} className="contest-display__fo-orbit-icon" />
        ))}
      </div>
      <MaterialSymbol name={surface.contestantIcon} className="contest-display__fo-main-icon" />
      <p className="contest-display__fo-name">{contestant.name}</p>
      <AnimatedScore
        className="contest-display__fo-score"
        score={contestant.score}
        signature={contestant.scoreSignature}
      />
    </div>
  );
}

function FaceOffCenter({
  matchup,
  surface,
}: {
  matchup: DisplayMatchup;
  surface: ContestDisplaySurface;
}) {
  return (
    <div className="contest-display__fo-center">
      <MaterialSymbol name={surface.centerIcon} className="contest-display__shaker-icon" />
      <span className="contest-display__fo-vs">VS</span>
      <span className="contest-display__fo-game">Game {matchup.slotIndex + 1}</span>
    </div>
  );
}

export function DisplayFaceOff({
  model,
  surface,
}: {
  model: DisplayModel;
  surface: ContestDisplaySurface;
}) {
  const matchup = model.featuredMatchup;
  const mode = model.featuredMatchupMode;
  const title =
    mode === 'shake' && matchup
      ? `Game ${matchup.slotIndex + 1} is active`
      : surface.standbySpotlightLabel;
  const label = mode === 'shake' ? surface.activeSpotlightLabel : surface.standbySpotlightLabel;

  return (
    <section className={`contest-display__face-off contest-display__face-off--${mode}`}>
      <header className="contest-display__fo-header">
        <p className="contest-display__label">{model.activeRoundName ?? 'Live round'}</p>
        <h2 className="contest-display__fo-title">{title}</h2>
        <span className={`contest-display__status contest-display__status--${mode}`}>
          {label}
        </span>
      </header>
      {matchup ? (
        <div className="contest-display__fo-matchup">
          <FaceOffContestant
            contestant={matchup.contestantA}
            surface={surface}
            side="left"
          />
          <FaceOffCenter matchup={matchup} surface={surface} />
          <FaceOffContestant
            contestant={matchup.contestantB}
            surface={surface}
            side="right"
          />
        </div>
      ) : (
        <p className="contest-display__empty">Waiting for finalists...</p>
      )}
    </section>
  );
}
