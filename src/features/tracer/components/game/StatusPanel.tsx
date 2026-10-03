'use client';

import { useRouter } from 'next/navigation';

import { emptySeat, type Viewer } from '../../lib/policy';
import { resultText } from '../../lib/presentation/gameText';
import type { TracerGame } from '../../lib/types';
import type { useGameCommands } from '../../hooks/useGameCommands';
import type { LiveStatus } from '../../hooks/useTracerGame';
import { DrawCard, InviteCard, JoinCard } from './StatusCards';
import { TurnNotice } from './TurnNotice';
import styles from './Status.module.scss';

interface StatusPanelProps {
  game: TracerGame;
  viewer: Viewer;
  live: LiveStatus;
  /** Sign-in is still being restored, so we cannot tell player from spectator yet. */
  identifying: boolean;
  defaultName: string;
  commands: ReturnType<typeof useGameCommands>;
  onJoin: (name: string) => void;
}

function ResultCard({ game, viewer, commands }: Pick<StatusPanelProps, 'game' | 'viewer' | 'commands'>) {
  const router = useRouter();
  async function rematch() {
    const created = game.rematchGameId ? { gameId: game.rematchGameId } : await commands.rematch();
    if (created) router.push(`/tracer/${created.gameId}`);
  }
  return (
    <div className={`${styles.card} ${styles.result}`}>
      <p className={styles.eyebrow}>Game over</p>
      <p className={styles.resultText}>{resultText(game)}</p>
      {viewer.role !== 'spectator' && (
        <button type="button" className={styles.primary} disabled={commands.busy} onClick={() => void rematch()}>
          {game.rematchGameId ? 'Go to the rematch' : 'Rematch (colours swap)'}
        </button>
      )}
    </div>
  );
}

/** The one card that matters most right now, plus any pending draw offer. */
export function StatusPanel({ game, viewer, live, identifying, defaultName, commands, onJoin }: StatusPanelProps) {
  const openSide = emptySeat(game);
  const offer = game.drawOffer;
  if (identifying) return <p className={styles.notice}>Checking your seat…</p>;
  return (
    <div className={styles.stack}>
      {live === 'error' && (
        <p className={`${styles.notice} ${styles.danger}`}>Live updates paused — reload the page if the board stops changing.</p>
      )}
      {commands.error && <p className={`${styles.notice} ${styles.danger}`}>{commands.error}</p>}
      {game.status === 'finished' && <ResultCard game={game} viewer={viewer} commands={commands} />}
      {viewer.canJoin && openSide && (
        <JoinCard game={game} side={openSide} defaultName={defaultName} busy={commands.busy} onJoin={onJoin} />
      )}
      {game.status === 'open' && viewer.role !== 'spectator' && <InviteCard game={game} />}
      {game.status === 'active' && <TurnNotice game={game} viewer={viewer} />}
      {offer && viewer.role !== 'spectator' && game.status === 'active' && (
        <DrawCard
          game={game}
          mine={viewer.sides.includes(offer.by) && viewer.role === 'player'}
          busy={commands.busy}
          onAnswer={(action) => void commands.draw(action)}
        />
      )}
    </div>
  );
}
