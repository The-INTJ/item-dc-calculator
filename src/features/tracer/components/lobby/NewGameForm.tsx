'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { GameSetupControls } from '../../hooks/useGameSetup';
import { usePlayerIdentity } from '../../hooks/usePlayerIdentity';
import { useStartLocalGame } from '../../hooks/useStartLocalGame';
import { errorCopy, tracerApi } from '../../lib/api/tracerApi';
import { NameField } from '../shared/NameField';
import { RuleTweaks } from './RuleTweaks';
import { StylePicker } from './StylePicker';
import styles from './Lobby.module.scss';

type SeatChoice = 'w' | 'b' | 'random';

const SEATS: { value: SeatChoice; label: string }[] = [
  { value: 'w', label: 'White' },
  { value: 'b', label: 'Black' },
  { value: 'random', label: 'Random' },
];

function SeatPicker({ seat, onChange }: { seat: SeatChoice; onChange: (seat: SeatChoice) => void }) {
  return (
    <fieldset className={styles.seats}>
      <legend>Play as</legend>
      {SEATS.map((option) => (
        <label key={option.value} className={seat === option.value ? styles.seatOn : styles.seat}>
          <input type="radio" name="seat" value={option.value} checked={seat === option.value} onChange={() => onChange(option.value)} />
          {option.label}
        </label>
      ))}
    </fieldset>
  );
}

/**
 * One form for both kinds of game. Online: a name and a side, then a link to
 * send. Both sides on this device: straight to a local board — no name, no
 * sign-in, no server. Either way the game is played under the chosen rules.
 */
export function NewGameForm({ controls }: { controls: GameSetupControls }) {
  const router = useRouter();
  const startLocalGame = useStartLocalGame();
  const { defaultName, ensurePlayer, loading } = usePlayerIdentity();
  const [name, setName] = useState<string | null>(null);
  const [seat, setSeat] = useState<SeatChoice>('w');
  const [local, setLocal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const displayName = (name ?? defaultName).trim();

  async function createOnline() {
    setBusy(true);
    setError(null);
    const signedIn = await ensurePlayer(displayName);
    const { styleId, rules } = controls.setup;
    const created = signedIn.ok ? await tracerApi.createGame({ displayName, seat, styleId, rules }) : null;
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
        if (local) startLocalGame(controls.setup);
        else void createOnline();
      }}
    >
      <h2 className={styles.cardTitle}>New game</h2>
      <StylePicker controls={controls} />
      <RuleTweaks controls={controls} />
      {!local && <NameField value={name ?? defaultName} onChange={setName} />}
      {!local && <SeatPicker seat={seat} onChange={setSeat} />}
      <label className={styles.check}>
        <input type="checkbox" checked={local} onChange={(event) => setLocal(event.target.checked)} />
        Play both sides on this device
      </label>
      {local && <p className={styles.hint}>A local game: nothing is sent anywhere, and it is saved in this browser.</p>}
      {error && <p className={styles.error}>{error}</p>}
      <button type="submit" className={styles.primary} disabled={!local && (busy || loading || displayName === '')}>
        {local ? 'Start local game' : busy ? 'Setting up the board…' : 'Create game & get link'}
      </button>
    </form>
  );
}
