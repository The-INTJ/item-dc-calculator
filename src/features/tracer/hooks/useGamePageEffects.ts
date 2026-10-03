'use client';

import { useEffect, useState } from 'react';

import { gameTitle } from '../lib/presentation/gameText';
import { rememberGame } from '../lib/recentGames';
import type { TracerGame } from '../lib/types';

/** A clock that ticks every `intervalMs`, for countdowns like seat release. */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);
  return now;
}

/**
 * Browser-side bookkeeping for the game page: the tab title says when it is
 * your move, and the game goes on this browser's recent list.
 */
export function useGamePageEffects(game: TracerGame, canMove: boolean): void {
  const title = gameTitle(game);

  useEffect(() => {
    document.title = canMove ? 'Your move · Tracer' : `${title} · Tracer`;
  }, [canMove, title]);

  useEffect(() => {
    rememberGame({ id: game.id, title });
  }, [game.id, title]);
}
