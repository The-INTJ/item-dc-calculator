'use client';

import Link from 'next/link';

import { BackToExperiments } from '@/components/ui/BackToExperiments';

import { recentGameHref, useRecentGames } from '../../lib/recentGames';
import { TIERED_V2 } from '../../variants';
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

export function TracerLobby() {
  return (
    <main className={styles.lobby}>
      <BackToExperiments className={styles.back} />
      <header className={styles.hero}>
        <h1>Tracer</h1>
        <p>
          Chess where pieces learn their moves from the paths you draw — and your king learns every
          one of them. Make a game, send the link, play a friend.
        </p>
      </header>
      <div className={styles.columns}>
        <div className={styles.stack}>
          <NewGameForm />
          <RecentGames />
        </div>
        <section className={styles.card} aria-labelledby="tracer-rules">
          <h2 id="tracer-rules" className={styles.cardTitle}>
            How to play
          </h2>
          <RulesList rules={TIERED_V2.rules} />
        </section>
      </div>
    </main>
  );
}
