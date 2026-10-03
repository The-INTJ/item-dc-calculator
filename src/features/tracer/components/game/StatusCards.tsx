'use client';

import { useState } from 'react';

import { otherSide, type Side } from '../../engine';
import { SIDE_NAME, seatName } from '../../lib/presentation/gameText';
import type { TracerGame } from '../../lib/types';
import { NameField } from '../shared/NameField';
import { gameUrl, shareLink } from './shareLink';
import styles from './Status.module.scss';

/** Waiting for an opponent: the link to send them. */
export function InviteCard({ game }: { game: TracerGame }) {
  const [note, setNote] = useState<string | null>(null);
  const url = gameUrl(game.id);
  async function share() {
    const outcome = await shareLink(`${game.createdBy.name} challenged you to Tracer`, url);
    setNote(outcome === 'copied' ? 'Link copied — paste it to a friend.' : null);
  }
  return (
    <div className={styles.card}>
      <p className={styles.eyebrow}>Waiting for an opponent</p>
      <p>Send this link to a friend. The game starts as soon as they join.</p>
      <input className={styles.link} readOnly value={url} aria-label="Game link" onFocus={(e) => e.currentTarget.select()} />
      <button type="button" className={styles.primary} onClick={() => void share()}>
        Share invite link
      </button>
      {note && <p className={styles.note} role="status">{note}</p>}
    </div>
  );
}

interface JoinCardProps {
  game: TracerGame;
  side: Side;
  defaultName: string;
  busy: boolean;
  onJoin: (name: string) => void;
}

/** A visitor with the link can take the open seat under a name of their choice. */
export function JoinCard({ game, side, defaultName, busy, onJoin }: JoinCardProps) {
  const [name, setName] = useState(defaultName);
  const host = seatName(game, otherSide(side));
  return (
    <form
      className={styles.card}
      onSubmit={(event) => {
        event.preventDefault();
        onJoin(name.trim());
      }}
    >
      <p className={styles.eyebrow}>You are invited</p>
      <p>
        {host} wants a game. You would play <strong>{SIDE_NAME[side]}</strong>.
      </p>
      <NameField value={name} onChange={setName} />
      <button type="submit" className={styles.primary} disabled={busy || name.trim() === ''}>
        Join as {SIDE_NAME[side]}
      </button>
    </form>
  );
}

interface DrawCardProps {
  game: TracerGame;
  mine: boolean;
  busy: boolean;
  onAnswer: (action: 'accept' | 'decline' | 'withdraw') => void;
}

export function DrawCard({ game, mine, busy, onAnswer }: DrawCardProps) {
  if (!game.drawOffer) return null;
  if (mine) {
    return (
      <div className={styles.card}>
        <p>You offered a draw. It stands until they answer or make a move.</p>
        <button type="button" className={styles.quiet} disabled={busy} onClick={() => onAnswer('withdraw')}>
          Withdraw offer
        </button>
      </div>
    );
  }
  return (
    <div className={`${styles.card} ${styles.attention}`}>
      <p>
        <strong>{seatName(game, game.drawOffer.by)}</strong> offers a draw.
      </p>
      <div className={styles.row}>
        <button type="button" className={styles.quiet} disabled={busy} onClick={() => onAnswer('decline')}>
          Decline
        </button>
        <button type="button" className={styles.primary} disabled={busy} onClick={() => onAnswer('accept')}>
          Accept draw
        </button>
      </div>
    </div>
  );
}
