'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { usePlayerIdentity } from '../../hooks/usePlayerIdentity';
import { errorCopy, tracerApi } from '../../lib/api/tracerApi';
import { NameField } from '../shared/NameField';
import styles from './Lobby.module.scss';

type SeatChoice = 'w' | 'b' | 'random';

const SEATS: { value: SeatChoice; label: string }[] = [
  { value: 'w', label: 'White' },
  { value: 'b', label: 'Black' },
  { value: 'random', label: 'Random' },
];

/** Name, side, and whether to play both sides here — then straight to the board. */
export function NewGameForm() {
  const router = useRouter();
  const { defaultName, ensurePlayer, loading } = usePlayerIdentity();
  const [name, setName] = useState<string | null>(null);
  const [seat, setSeat] = useState<SeatChoice>('w');
  const [hotseat, setHotseat] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const displayName = (name ?? defaultName).trim();

  async function create() {
    setBusy(true);
    setError(null);
    const signedIn = await ensurePlayer(displayName);
    const created = signedIn.ok
      ? await tracerApi.createGame({ displayName, seat, mode: hotseat ? 'hotseat' : 'online' })
      : null;
    if (created?.ok) {
      router.push(`/tracer/${created.data.gameId}`);
      return;
    }
    setBusy(false);
    setError(created ? errorCopy(created) : signedIn.ok ? null : signedIn.message);
  }

  return (
    <form
      className={styles.card}
      onSubmit={(event) => {
        event.preventDefault();
        void create();
      }}
    >
      <h2 className={styles.cardTitle}>New game</h2>
      <NameField value={name ?? defaultName} onChange={setName} />
      <fieldset className={styles.seats} disabled={hotseat}>
        <legend>Play as</legend>
        {SEATS.map((option) => (
          <label key={option.value} className={seat === option.value ? styles.seatOn : styles.seat}>
            <input type="radio" name="seat" value={option.value} checked={seat === option.value} onChange={() => setSeat(option.value)} />
            {option.label}
          </label>
        ))}
      </fieldset>
      <label className={styles.check}>
        <input type="checkbox" checked={hotseat} onChange={(event) => setHotseat(event.target.checked)} />
        Play both sides on this device
      </label>
      {error && <p className={styles.error}>{error}</p>}
      <button type="submit" className={styles.primary} disabled={busy || loading || displayName === ''}>
        {busy ? 'Setting up the board…' : hotseat ? 'Start game' : 'Create game & get link'}
      </button>
    </form>
  );
}
