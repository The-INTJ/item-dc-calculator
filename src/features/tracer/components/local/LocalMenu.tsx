'use client';

import { useState } from 'react';

import { SIDE_NAME } from '../../lib/presentation/gameText';
import { sideToMove } from '../../engine';
import type { TracerGame } from '../../lib/types';
import { ConfirmSheet } from '../shared/Sheet';
import styles from '../game/Menu.module.scss';

interface LocalMenuProps {
  game: TracerGame;
  canUndo: boolean;
  onUndo: () => void;
  onDraw: () => void;
  onResign: () => void;
  onNewGame: () => void;
}

/** Playtesting controls for a game played on this device. */
export function LocalMenu({ game, canUndo, onUndo, onDraw, onResign, onNewGame }: LocalMenuProps) {
  const [open, setOpen] = useState(false);
  const [confirmResign, setConfirmResign] = useState(false);
  const active = game.status === 'active';
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
          {canUndo && (
            <button type="button" role="menuitem" onClick={run(onUndo)}>
              Undo last move
            </button>
          )}
          {active && (
            <button type="button" role="menuitem" onClick={run(onDraw)}>
              Call it a draw
            </button>
          )}
          {active && (
            <button type="button" role="menuitem" className={styles.danger} onClick={run(() => setConfirmResign(true))}>
              {SIDE_NAME[sideToMove(game.state)]} resigns
            </button>
          )}
          <button type="button" role="menuitem" onClick={run(onNewGame)}>
            New game, same rules
          </button>
        </div>
      )}
      <ConfirmSheet
        open={confirmResign}
        title={`${SIDE_NAME[sideToMove(game.state)]} resigns?`}
        body="The game ends and the other side wins. Undo can bring it back."
        confirmLabel="Resign"
        danger
        onConfirm={() => {
          setConfirmResign(false);
          onResign();
        }}
        onCancel={() => setConfirmResign(false)}
      />
    </div>
  );
}
