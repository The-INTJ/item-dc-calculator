'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import {
  getBracketGridRowCount,
  getMatchupGridPlacement,
} from '@/contest/lib/domain/bracketMath';
import {
  getContestDisplaySurface,
  type ContestDisplaySurface,
} from '@/contest/lib/presentation/displaySurface';
import type {
  DisplayContestant,
  DisplayMatchup,
  DisplayModel,
  DisplayRound,
} from '@/contest/lib/presentation/displayModel';
import { AnimatedScore } from './AnimatedScore';
import { MaterialSymbol } from './MaterialSymbol';

interface DisplayBracketProps {
  model: DisplayModel;
}

const RAIN_LEFTS = [
  2, 7, 13, 19, 24, 31, 37, 43, 49, 55, 62, 68, 73, 79, 84, 91, 96, 11, 28, 46,
  64, 82, 5, 35, 58, 88,
];

function formatLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function matchupLabel(matchup: DisplayMatchup | null) {
  if (!matchup) return 'Waiting for active round';
  return `${matchup.contestantA.name} vs ${matchup.contestantB.name}`;
}

function useBumpOnChange(signature: string) {
  const [bumping, setBumping] = useState(false);
  const previous = useRef(signature);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      previous.current = signature;
      return undefined;
    }

    if (previous.current === signature) return undefined;
    previous.current = signature;

    setBumping(false);
    const start = window.setTimeout(() => setBumping(true), 0);
    const clear = window.setTimeout(() => setBumping(false), 760);

    return () => {
      window.clearTimeout(start);
      window.clearTimeout(clear);
    };
  }, [signature]);

  return bumping;
}

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
  surface,
  onRef,
}: {
  matchup: DisplayMatchup;
  round: DisplayRound;
  surface: ContestDisplaySurface;
  onRef: (key: string, el: HTMLElement | null) => void;
}) {
  const { rowStart, rowSpan } = getMatchupGridPlacement(round.roundIndex, matchup.slotIndex);
  const key = `${round.roundIndex}-${matchup.slotIndex}`;
  const scoreSignature = `${matchup.contestantA.scoreSignature}|${matchup.contestantB.scoreSignature}`;
  const bumping = useBumpOnChange(scoreSignature);

  const classes = [
    'contest-display__matchup',
    round.isActive && matchup.phase === 'shake' ? 'contest-display__matchup--active' : '',
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
    >
      <MatchupSparkles surface={surface} />
      <ContestantRow contestant={matchup.contestantA} surface={surface} />
      {matchup.isBye ? (
        <p className="contest-display__bye-label">Bye</p>
      ) : (
        <ContestantRow contestant={matchup.contestantB} surface={surface} />
      )}
      {matchup.winnerId && !matchup.isBye ? (
        <span className="contest-display__badge">Leader</span>
      ) : null}
    </article>
  );
}

function BracketColumn({
  round,
  totalRounds,
  surface,
  onMatchupRef,
}: {
  round: DisplayRound;
  totalRounds: number;
  surface: ContestDisplaySurface;
  onMatchupRef: (key: string, el: HTMLElement | null) => void;
}) {
  const totalRows = getBracketGridRowCount(totalRounds);
  const classes = ['contest-display__column'];
  if (round.isActive) classes.push('contest-display__column--active');

  return (
    <section className={classes.join(' ')} aria-label={round.name}>
      <header className="contest-display__column-header">
        <p className="contest-display__label">{round.isActive ? 'Now Playing' : 'Round'}</p>
        <h2 className="contest-display__column-title">{round.name}</h2>
        <span className={`contest-display__status contest-display__status--${round.status}`}>
          {formatLabel(round.status)}
        </span>
      </header>
      <div
        className="contest-display__column-grid"
        style={{
          gridTemplateRows: `repeat(${totalRows}, minmax(0, 1fr))`,
        }}
      >
        {round.matchups.map((matchup) => (
          <BracketMatchupCard
            key={matchup.id}
            matchup={matchup}
            round={round}
            surface={surface}
            onRef={onMatchupRef}
          />
        ))}
      </div>
    </section>
  );
}

interface ConnectorPath {
  id: string;
  d: string;
  feedsActive: boolean;
}

function computeConnectorPaths(
  rounds: DisplayRound[],
  rects: Map<string, DOMRect>,
  canvasRect: DOMRect | null,
): ConnectorPath[] {
  if (!canvasRect) return [];
  const paths: ConnectorPath[] = [];

  for (let r = 1; r < rounds.length; r++) {
    const round = rounds[r];
    if (!round) continue;

    for (const matchup of round.matchups) {
      if (!matchup.sourceMatchups) continue;
      const targetKey = `${r}-${matchup.slotIndex}`;
      const targetRect = rects.get(targetKey);
      if (!targetRect) continue;

      const targetX = targetRect.left - canvasRect.left;
      const targetY = targetRect.top + targetRect.height / 2 - canvasRect.top;

      for (const feederIndex of matchup.sourceMatchups) {
        const feederKey = `${r - 1}-${feederIndex}`;
        const feederRect = rects.get(feederKey);
        if (!feederRect) continue;

        const feederX = feederRect.right - canvasRect.left;
        const feederY = feederRect.top + feederRect.height / 2 - canvasRect.top;
        const midX = feederX + (targetX - feederX) / 2;

        const d = `M ${feederX} ${feederY} H ${midX} V ${targetY} H ${targetX}`;
        paths.push({
          id: `${feederKey}->${targetKey}`,
          d,
          feedsActive: round.isActive,
        });
      }
    }
  }

  return paths;
}

function BracketCanvas({
  rounds,
  totalRounds,
  surface,
}: {
  rounds: DisplayRound[];
  totalRounds: number;
  surface: ContestDisplaySurface;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const matchupRefs = useRef<Map<string, HTMLElement | null>>(new Map());
  const [paths, setPaths] = useState<ConnectorPath[]>([]);
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  const recomputePaths = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasRect = canvas.getBoundingClientRect();
    setCanvasSize({ width: canvasRect.width, height: canvasRect.height });

    const rects = new Map<string, DOMRect>();
    matchupRefs.current.forEach((el, key) => {
      if (el) rects.set(key, el.getBoundingClientRect());
    });

    setPaths(computeConnectorPaths(rounds, rects, canvasRect));
  }, [rounds]);

  const handleMatchupRef = useCallback((key: string, el: HTMLElement | null) => {
    if (el) {
      matchupRefs.current.set(key, el);
    } else {
      matchupRefs.current.delete(key);
    }
  }, []);

  useLayoutEffect(() => {
    recomputePaths();
  }, [recomputePaths, rounds]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => recomputePaths());
    observer.observe(canvas);
    matchupRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    window.addEventListener('resize', recomputePaths);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', recomputePaths);
    };
  }, [recomputePaths]);

  return (
    <div
      className="contest-display__canvas"
      ref={canvasRef}
      style={{ '--total-rounds': totalRounds } as CSSProperties}
    >
      <svg
        className="contest-display__connectors"
        width={canvasSize.width}
        height={canvasSize.height}
        viewBox={`0 0 ${canvasSize.width || 1} ${canvasSize.height || 1}`}
        aria-hidden="true"
      >
        {paths.map((path) => (
          <path
            key={path.id}
            d={path.d}
            className={`contest-display__connector${
              path.feedsActive ? ' contest-display__connector--feeds-active' : ''
            }`}
          />
        ))}
      </svg>
      <div className="contest-display__columns">
        {rounds.map((round) => (
          <BracketColumn
            key={round.id}
            round={round}
            totalRounds={totalRounds}
            surface={surface}
            onMatchupRef={handleMatchupRef}
          />
        ))}
      </div>
    </div>
  );
}

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

function DisplayFaceOff({
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

function firstMatchup(round: DisplayRound | null | undefined) {
  return round?.matchups[0] ?? null;
}

function featuredPanelTitle(model: DisplayModel, surface: ContestDisplaySurface) {
  if (model.featuredMatchupMode === 'standby') return surface.standbySpotlightLabel;
  return model.featuredMatchup?.contestantA.name ?? 'Waiting for active round';
}

function featuredPanelSubtitle(model: DisplayModel) {
  if (!model.featuredMatchup) return 'No matchup currently scoring';
  if (model.featuredMatchupMode === 'standby') {
    return `Next look: ${matchupLabel(model.featuredMatchup)}`;
  }
  return `vs ${model.featuredMatchup.contestantB.name}`;
}

export function DisplayBracket({ model }: DisplayBracketProps) {
  const surface = getContestDisplaySurface(model.contestKind);
  const bracketRounds = model.isFinalRoundActive ? model.rounds.slice(0, -1) : model.rounds;
  const faceOffRound = model.isFinalRoundActive
    ? model.rounds[model.rounds.length - 1]
    : null;
  const activeRound = model.rounds.find((round) => round.id === model.activeRoundId) ?? null;
  const activeRoundIndex = activeRound
    ? model.rounds.findIndex((round) => round.id === activeRound.id)
    : -1;
  const nextRound = activeRoundIndex >= 0 ? model.rounds[activeRoundIndex + 1] ?? null : null;
  const nextMatchup = firstMatchup(nextRound);
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
            On Air / {model.activeRoundName ?? 'Waiting'}
          </Link>
          <h1 className="contest-display__title">{model.contestName}</h1>
          <p className="contest-display__meta">
            {formatLabel(model.phase)} phase / {model.totalRounds} rounds / Live updates
          </p>
        </div>
        <div className="contest-display__ticker">
          <section className="contest-display__panel contest-display__panel--now">
            <span className="contest-display__label">
              <MaterialSymbol name={surface.centerIcon} className="contest-display__panel-icon" />
              {model.featuredMatchupMode === 'shake'
                ? surface.nowPanelLabel
                : surface.standbyPanelLabel}
            </span>
            <strong className="contest-display__value">{featuredPanelTitle(model, surface)}</strong>
            <span className="contest-display__panel-sub">{featuredPanelSubtitle(model)}</span>
          </section>
          <section className="contest-display__panel contest-display__panel--next">
            <span className="contest-display__label">
              <MaterialSymbol name="double_arrow" className="contest-display__panel-icon" />
              {surface.nextPanelLabel}
            </span>
            <strong className="contest-display__value">
              {nextMatchup
                ? nextMatchup.contestantA.name
                : model.nextRoundName ?? 'No next round queued'}
            </strong>
            <span className="contest-display__panel-sub">
              {nextMatchup ? `vs ${nextMatchup.contestantB.name}` : 'Awaiting bracket advance'}
            </span>
          </section>
        </div>
      </header>

      {model.rounds.length === 0 ? (
        <p className="contest-display__empty">No rounds have been created yet.</p>
      ) : (
        <>
          {bracketRounds.length > 0 && (
            <BracketCanvas
              rounds={bracketRounds}
              totalRounds={bracketRounds.length}
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
          {model.activeShakeMatchup
            ? `${model.activeRoundName ?? 'Round'} is live. ${surface.feedActiveMessage}`
            : surface.feedStandbyMessage}
        </span>
      </footer>
    </section>
  );
}
