'use client';

import { useRouter } from 'next/navigation';

import { newLocalGame } from '../lib/local/localGame';
import { newLocalGameId, saveLocalGame } from '../lib/local/localStore';
import { rememberGame } from '../lib/recentGames';

/** Start a fresh game on this device and open it. No sign-in, no server. */
export function useStartLocalGame() {
  const router = useRouter();
  return () => {
    const record = newLocalGame(newLocalGameId(), Date.now());
    const href = `/tracer/local/${record.id}`;
    saveLocalGame(record);
    rememberGame({ id: record.id, title: 'Local game · turn 1', href });
    router.push(href);
  };
}
