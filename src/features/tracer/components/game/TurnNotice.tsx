'use client';

import { useState } from 'react';

import { isKingInDanger, otherSide, sideToMove } from '../../engine';
import { seatName } from '../../lib/presentation/gameText';
import type { Viewer } from '../../lib/policy';
import type { TracerGame } from '../../lib/types';
import { gameUrl, shareLink } from './shareLink';
import styles from './Status.module.scss';

/** Whose move it is, a warning when your king is under attack, and a nudge. */
export function TurnNotice({ game, viewer }: { game: TracerGame; viewer: Viewer }) {
  const [copied, setCopied] = useState(false);
  const toMove = sideToMove(game.state);
  const waitingOn = seatName(game, toMove);

  if (viewer.role === 'spectator') {
    return (
      <p className={styles.notice}>
        Watching {seatName(game, 'w')} vs {seatName(game, 'b')} — {waitingOn} to move.
      </p>
    );
  }
  if (viewer.canMove) {
    const inDanger = isKingInDanger(game.state, toMove);
    return (
      <div className={inDanger ? `${styles.notice} ${styles.danger}` : `${styles.notice} ${styles.yourMove}`}>
        <strong>Your move.</strong>
        {inDanger && ' Your king is under attack — dodge, block, or capture the attacker.'}
      </div>
    );
  }
  const opponentSeat = game.seats[otherSide(viewer.actingSide ?? 'w')];
  async function nudge() {
    const outcome = await shareLink(`Your move in Tracer!`, gameUrl(game.id));
    setCopied(outcome === 'copied');
  }
  return (
    <div className={styles.notice}>
      <span>Waiting for {waitingOn}…</span>
      {opponentSeat.uid && (
        <button type="button" className={styles.link_button} onClick={() => void nudge()}>
          {copied ? 'Link copied' : `Tell ${waitingOn} it’s their move`}
        </button>
      )}
    </div>
  );
}
