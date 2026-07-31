'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import type { ContestDisplaySurface } from '@/contest/lib/presentation/displaySurface';
import type { DisplayRound } from '@/contest/lib/presentation/displayModel';
import { BracketColumn } from './BracketColumn';
import { computeConnectorPaths, type ConnectorPath } from './bracketConnectors';

/** Measures matchup cards and the canvas to keep connector paths in sync. */
function useConnectorPaths(rounds: DisplayRound[]) {
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

  return { canvasRef, canvasSize, paths, handleMatchupRef };
}

export function BracketCanvas({
  rounds,
  totalRounds,
  gridRowCount,
  surface,
}: {
  rounds: DisplayRound[];
  totalRounds: number;
  gridRowCount: number;
  surface: ContestDisplaySurface;
}) {
  const { canvasRef, canvasSize, paths, handleMatchupRef } = useConnectorPaths(rounds);

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
            gridRowCount={gridRowCount}
            surface={surface}
            onMatchupRef={handleMatchupRef}
          />
        ))}
      </div>
    </div>
  );
}
