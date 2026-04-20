'use client';

import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  getBracketGridRowCount,
  getMatchupGridPlacement,
} from '@/contest/lib/domain/bracketMath';
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

function BracketMatchupCard({
  matchup,
  round,
  onRef,
}: {
  matchup: DisplayMatchup;
  round: DisplayRound;
  onRef: (key: string, el: HTMLElement | null) => void;
}) {
  const { rowStart, rowSpan } = getMatchupGridPlacement(round.roundIndex, matchup.slotIndex);
  const key = `${round.roundIndex}-${matchup.slotIndex}`;

  const classes = ['contest-display__matchup'];
  if (round.isActive) classes.push('contest-display__matchup--active');

  return (
    <article
      className={classes.join(' ')}
      style={{
        gridRow: `${rowStart} / span ${rowSpan}`,
      }}
      ref={(el) => onRef(key, el)}
      data-matchup-key={key}
    >
      <ContestantRow contestant={matchup.contestantA} />
      <ContestantRow contestant={matchup.contestantB} />
      {matchup.winnerId ? <span className="contest-display__badge">Leader</span> : null}
    </article>
  );
}

function BracketColumn({
  round,
  totalRounds,
  onMatchupRef,
}: {
  round: DisplayRound;
  totalRounds: number;
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

function BracketCanvas({ rounds, totalRounds }: { rounds: DisplayRound[]; totalRounds: number }) {
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
      style={{ '--total-rounds': totalRounds } as React.CSSProperties}
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
            onMatchupRef={handleMatchupRef}
          />
        ))}
      </div>
    </div>
  );
}

function FaceOffContestant({ contestant }: { contestant: DisplayContestant }) {
  return (
    <div
      className={`contest-display__fo-contestant${
        contestant.isWinner ? ' contest-display__fo-contestant--leader' : ''
      }`}
    >
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

export function DisplayBracket({ model }: DisplayBracketProps) {
  const bracketRounds = model.isFinalRoundActive ? model.rounds.slice(0, -1) : model.rounds;
  const faceOffRound = model.isFinalRoundActive
    ? model.rounds[model.rounds.length - 1]
    : null;

  return (
    <section className="contest-display">
      <header className="contest-display__hero">
        <div>
          <Link
            href={`/contest/${model.contestId}`}
            className="contest-display__eyebrow contest-display__eyebrow--link"
          >
            Display Mode
          </Link>
          <h1 className="contest-display__title">{model.contestName}</h1>
          <p className="contest-display__meta">
            {formatLabel(model.phase)} phase · {model.totalRounds} rounds · Live updates
          </p>
        </div>
        <div className="contest-display__ticker">
          <section className="contest-display__panel">
            <span className="contest-display__label">Now Playing</span>
            <strong className="contest-display__value">
              {model.activeRoundName ?? 'Waiting for active round'}
            </strong>
          </section>
          <section className="contest-display__panel">
            <span className="contest-display__label">Up Next</span>
            <strong className="contest-display__value">
              {model.nextRoundName ?? 'No next round queued'}
            </strong>
          </section>
        </div>
      </header>

      {model.rounds.length === 0 ? (
        <p className="contest-display__empty">No rounds have been created yet.</p>
      ) : (
        <>
          {bracketRounds.length > 0 && (
            <BracketCanvas rounds={bracketRounds} totalRounds={bracketRounds.length} />
          )}
          {faceOffRound && <DisplayFaceOff round={faceOffRound} />}
        </>
      )}
    </section>
  );
}
