'use client';

import Link from 'next/link';
import { type CSSProperties } from 'react';
import {
  getContestDisplaySurface,
  type ContestDisplaySurface,
} from '@/contest/lib/presentation/displaySurface';
import type {
  DisplayChampion,
  DisplayModel,
} from '@/contest/lib/presentation/displayModel';
import { BracketCanvas } from './BracketCanvas';
import { DisplayFaceOff } from './DisplayFaceOff';
import { DisplayTicker } from './DisplayTicker';
import { MaterialSymbol } from './MaterialSymbol';
import { formatLabel } from './displayLabels';

export { computeConnectorPaths, type ConnectorPath } from './bracketConnectors';

interface DisplayBracketProps {
  model: DisplayModel;
}

const RAIN_LEFTS = [
  2, 7, 13, 19, 24, 31, 37, 43, 49, 55, 62, 68, 73, 79, 84, 91, 96, 11, 28, 46,
  64, 82, 5, 35, 58, 88,
];

function IconRain({ surface }: { surface: ContestDisplaySurface }) {
  const amount = surface.kind === 'mixology' ? RAIN_LEFTS.length : 10;
  const slots = RAIN_LEFTS.slice(0, amount);

  return (
    <div className="contest-display__icon-rain" aria-hidden="true">
      {slots.map((left, index) => {
        const style = {
          '--fall-left': `${left}%`,
          '--fall-delay': `${-index * 0.47}s`,
          '--fall-duration': `${5.8 + (index % 7) * 0.42}s`,
          '--fall-size': `${1.25 + (index % 5) * 0.22}rem`,
        } as CSSProperties;

        return (
          <MaterialSymbol
            key={`${left}-${index}`}
            name={surface.rainIcons[index % surface.rainIcons.length]}
            className="contest-display__rain-icon"
            style={style}
          />
        );
      })}
    </div>
  );
}

function BubbleField({ surface }: { surface: ContestDisplaySurface }) {
  if (surface.kind !== 'mixology') return null;

  return (
    <div className="contest-display__bubbles" aria-hidden="true">
      {Array.from({ length: 18 }, (_, index) => (
        <span
          key={index}
          style={
            {
              '--bubble-left': `${6 + ((index * 17) % 88)}%`,
              '--bubble-delay': `${-index * 0.31}s`,
              '--bubble-size': `${0.45 + (index % 4) * 0.22}rem`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

function ChampionBanner({ champion }: { champion: DisplayChampion }) {
  return (
    <section
      className="contest-display__champion"
      role="status"
      aria-live="polite"
    >
      <p className="contest-display__champion-eyebrow">
        <MaterialSymbol
          name="emoji_events"
          className="contest-display__champion-icon"
        />
        Champion · {champion.finalRoundName}
      </p>
      <h2 className="contest-display__champion-name">
        {champion.contestant.name}
      </h2>
      {champion.runnerUp && (
        <p className="contest-display__champion-meta">
          Defeated {champion.runnerUp.name}
          {typeof champion.contestant.score === 'number' &&
          typeof champion.runnerUp.score === 'number'
            ? ` ${champion.contestant.score} – ${champion.runnerUp.score}`
            : ''}
        </p>
      )}
    </section>
  );
}

export function DisplayBracket({ model }: DisplayBracketProps) {
  const surface = getContestDisplaySurface(model.contestKind);
  // The face-off swap happens only for a true 1-matchup, non-bye final (the
  // model decides); the sliced prefix keeps roundIndex aligned for connectors.
  const faceOffRound = model.faceOffRoundId
    ? model.rounds.find((round) => round.id === model.faceOffRoundId) ?? null
    : null;
  const bracketRounds = faceOffRound ? model.rounds.slice(0, -1) : model.rounds;
  const classes = ['contest-display', surface.rootClassName].join(' ');

  return (
    <section
      className={classes}
      data-theme="broadcast"
      data-contest-kind={model.contestKind}
      data-featured-mode={model.featuredMatchupMode}
    >
      <IconRain surface={surface} />
      <BubbleField surface={surface} />
      <header className="contest-display__hero">
        <div className="contest-display__hero-copy">
          <Link
            href={`/contest/${model.contestId}`}
            className="contest-display__eyebrow contest-display__eyebrow--link"
          >
            <span className="live-dot" aria-hidden="true" />
            <MaterialSymbol name={surface.eyebrowIcon} className="contest-display__eyebrow-icon" />
            On Air / {model.champion ? 'Champion crowned' : model.activeRoundName ?? 'Waiting'}
          </Link>
          <h1 className="contest-display__title">{model.contestName}</h1>
          <p className="contest-display__meta">
            {model.champion
              ? `Tournament complete / ${model.totalRounds} rounds / Final results`
              : `${formatLabel(model.phase)} phase / ${model.totalRounds} rounds / Live updates`}
          </p>
        </div>
        <DisplayTicker model={model} surface={surface} />
      </header>

      {model.rounds.length === 0 ? (
        <p className="contest-display__empty">No rounds have been created yet.</p>
      ) : (
        <>
          {model.champion && <ChampionBanner champion={model.champion} />}
          {bracketRounds.length > 0 && (
            <BracketCanvas
              rounds={bracketRounds}
              totalRounds={bracketRounds.length}
              gridRowCount={model.gridRowCount}
              surface={surface}
            />
          )}
          {faceOffRound && <DisplayFaceOff model={model} surface={surface} />}
        </>
      )}

      <footer className="contest-display__feed">
        <span className="contest-display__feed-label">
          <span aria-hidden="true" />
          <MaterialSymbol name={surface.eyebrowIcon} className="contest-display__feed-icon" />
          {surface.feedLabel}
        </span>
        <span>
          {model.champion
            ? `${model.champion.contestant.name} took the title. Last call.`
            : model.activeShakeMatchup
              ? `${model.activeRoundName ?? 'Round'} is live. ${surface.feedActiveMessage}`
              : surface.feedStandbyMessage}
        </span>
      </footer>
    </section>
  );
}
