'use client';

import { useState } from 'react';

import { otherSide } from '../../engine';
import type { useGameCommands } from '../../hooks/useGameCommands';
import { seatReleaseAvailableAt, type Viewer } from '../../lib/policy';
import type { TracerGame } from '../../lib/types';
import { ConfirmSheet } from '../shared/Sheet';
import { gameUrl, shareLink } from './shareLink';
import styles from './Menu.module.scss';

interface GameMenuProps {
  game: TracerGame;
  viewer: Viewer;
  commands: ReturnType<typeof useGameCommands>;
  now: number;
}

/** Less frequent actions, tucked behind one button. */
export function GameMenu({ game, viewer, commands, now }: GameMenuProps) {
  const [open, setOpen] = useState(false);
  const [confirmResign, setConfirmResign] = useState(false);
  const playing = viewer.role !== 'spectator' && game.status === 'active';
  const opponent = viewer.role === 'player' && viewer.actingSide ? otherSide(viewer.actingSide) : null;
  const releaseAt = opponent ? seatReleaseAvailableAt(game, opponent) : null;
  const canOfferDraw = playing && !game.drawOffer;
  const run = (action: () => void) => () => {
    setOpen(false);
    action();
  };

  return (
    <div className={styles.menu}>
      <button type="button" className={styles.trigger} aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen(!open)}>
        Menu
      </button>
      {open && (
        <div className={styles.items} role="menu">
          <button type="button" role="menuitem" onClick={run(() => void shareLink('Tracer game', gameUrl(game.id)))}>
            Share game link
          </button>
          {canOfferDraw && (
            <button type="button" role="menuitem" onClick={run(() => void commands.draw('offer'))}>
              Offer a draw
            </button>
          )}
          {opponent && releaseAt !== null && now >= releaseAt && (
            <button type="button" role="menuitem" onClick={run(() => void commands.releaseSeat(opponent))}>
              Reopen opponent’s seat
            </button>
          )}
          {playing && (
            <button type="button" role="menuitem" className={styles.danger} onClick={run(() => setConfirmResign(true))}>
              Resign
            </button>
          )}
        </div>
      )}
      <ConfirmSheet
        open={confirmResign}
        title="Resign this game?"
        body="Your opponent wins. You can offer a rematch afterwards."
        confirmLabel="Resign"
        danger
        onConfirm={() => {
          setConfirmResign(false);
          void commands.resign();
        }}
        onCancel={() => setConfirmResign(false)}
      />
    </div>
  );
}
