'use client';

import Link from 'next/link';

import { BackToExperiments } from '@/components/ui/BackToExperiments';

import { useGameSetup } from '../../hooks/useGameSetup';
import { recentGameHref, useRecentGames } from '../../lib/recentGames';
import { RulesList } from '../panels/GamePanels';
import { NewGameForm } from './NewGameForm';
import styles from './Lobby.module.scss';

function RecentGames() {
  const recent = useRecentGames();
  if (recent.length === 0) return null;
  return (
    <section className={styles.card} aria-labelledby="tracer-recent">
      <h2 id="tracer-recent" className={styles.cardTitle}>
        Your recent games
      </h2>
      <ul className={styles.recent}>
        {recent.map((game) => (
          <li key={game.id}>
            <Link href={recentGameHref(game)}>{game.title}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** `setupQuery`: the page's query string — a setup link prefills the new-game form. */
export function TracerLobby({ setupQuery = '' }: { setupQuery?: string }) {
  const setup = useGameSetup(setupQuery);
  return (
    <main className={styles.lobby}>
      <BackToExperiments className={styles.back} />
      <header className={styles.hero}>
        <h1>Tracer</h1>
        <p>
          Chess where pieces learn their moves from the paths you draw — and your king borrows them.
          Pick a style, make a game, send the link, play a friend.
        </p>
      </header>
      <div className={styles.columns}>
        <div className={styles.stack}>
          <NewGameForm controls={setup} />
          <RecentGames />
        </div>
        <section className={styles.card} aria-labelledby="tracer-rules">
          <h2 id="tracer-rules" className={styles.cardTitle}>
            How to play · {setup.style.name}
            {setup.tweaks.length > 0 && ' (tweaked)'}
          </h2>
          <RulesList rules={setup.setup.rules} />
        </section>
      </div>
    </main>
  );
}
