/**
 * Live Firestore listeners for one game and its turn history.
 *
 * Unlike the contest's paced subscriptions these deliver every snapshot and
 * surface errors to the caller, so a missing rules deploy or a dropped
 * connection shows up in the UI instead of only in the console. Neither
 * needs a signed-in user: games are readable by anyone holding the link.
 */

import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore';

import { initializeFirebase } from '@/contest/lib/firebase/config';

import { fromGameDoc, fromTurnDoc } from '../storage/gameDocument';
import type { StoredTurn, TracerGame } from '../types';

const GAMES = 'tracerGames';

type Unsubscribe = () => void;

function unavailable(onError: (error: Error) => void): Unsubscribe {
  onError(new Error('Live updates are unavailable.'));
  return () => {};
}

/** `onGame(null)` means the game document does not exist. */
export function subscribeToGame(
  gameId: string,
  onGame: (game: TracerGame | null) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const { db } = initializeFirebase();
  if (!db) return unavailable(onError);
  return onSnapshot(
    doc(db, GAMES, gameId),
    (snapshot) => {
      if (!snapshot.exists()) {
        onGame(null);
        return;
      }
      const game = fromGameDoc(snapshot.id, snapshot.data());
      if (game) onGame(game);
      else onError(new Error('This game could not be read.'));
    },
    onError,
  );
}

export function subscribeToTurns(
  gameId: string,
  onTurns: (turns: StoredTurn[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const { db } = initializeFirebase();
  if (!db) return unavailable(onError);
  return onSnapshot(
    query(collection(db, GAMES, gameId, 'turns'), orderBy('ply')),
    (snapshot) => {
      const turns = snapshot.docs.map((turn) => fromTurnDoc(turn.data()));
      onTurns(turns.filter((turn): turn is StoredTurn => turn !== null));
    },
    onError,
  );
}
