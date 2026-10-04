'use client';

import { useRouter } from 'next/navigation';

import { newLocalGame } from '../lib/local/localGame';
import { newLocalGameId, saveLocalGame } from '../lib/local/localStore';
import { rememberGame } from '../lib/recentGames';
import { DEFAULT_STYLE_ID, styleById, styleRef, type GameSetup, type GameStyle } from '../variants';

const DEFAULT_SETUP: GameSetup = {
  styleId: DEFAULT_STYLE_ID,
  rules: (styleById(DEFAULT_STYLE_ID) as GameStyle).rules,
};

/** Start a fresh game on this device under `setup` and open it. No sign-in, no server. */
export function useStartLocalGame() {
  const router = useRouter();
  return (setup: GameSetup = DEFAULT_SETUP) => {
    const style = styleById(setup.styleId) ?? (styleById(DEFAULT_STYLE_ID) as GameStyle);
    const record = newLocalGame(newLocalGameId(), Date.now(), styleRef(style), setup.rules);
    const href = `/tracer/local/${record.id}`;
    saveLocalGame(record);
    rememberGame({ id: record.id, title: 'Local game · turn 1', href });
    router.push(href);
  };
}
