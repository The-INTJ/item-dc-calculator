import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { TracerAuth, TracerGameView } from '@/features/tracer';
import { gameTitle } from '@/features/tracer/lib/presentation/gameText';
import { loadGameForPage } from '@/features/tracer/lib/server';

// Always render fresh: the game changes with every move.
export const dynamic = 'force-dynamic';

interface GamePageProps {
  params: Promise<{ gameId: string }>;
}

const DESCRIPTION = 'Chess where pieces learn their moves from the paths you draw.';

/** Link previews: "Drew challenged you to Tracer" unfurls in messaging apps. */
export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const { gameId } = await params;
  const loaded = await loadGameForPage(gameId);
  if (loaded.status === 'missing') return { title: 'Game not found' };
  if (loaded.status === 'outdated') return { title: 'Game from the first rules' };
  const title = gameTitle(loaded.game);
  return {
    title,
    description: DESCRIPTION,
    openGraph: { title, description: DESCRIPTION, type: 'website', siteName: 'Tracer' },
    twitter: { card: 'summary', title, description: DESCRIPTION },
  };
}

function OutdatedGame() {
  return (
    <main style={{ display: 'grid', gap: '0.75rem', padding: '2rem 1rem', maxWidth: '32rem', margin: '0 auto' }}>
      <h1>This game used the first rules</h1>
      <p>Tracer has changed since this game was played, so it cannot be continued.</p>
      <Link href="/tracer">Start a new game</Link>
    </main>
  );
}

export default async function TracerGamePage({ params }: GamePageProps) {
  const { gameId } = await params;
  const loaded = await loadGameForPage(gameId);
  if (loaded.status === 'missing') notFound();
  if (loaded.status === 'outdated') return <OutdatedGame />;
  return (
    <TracerAuth>
      <TracerGameView key={loaded.game.id} initialGame={loaded.game} />
    </TracerAuth>
  );
}
