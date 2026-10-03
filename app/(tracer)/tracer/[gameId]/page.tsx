import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { TracerGameView } from '@/features/tracer';
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
  const game = await loadGameForPage(gameId);
  if (!game) return { title: 'Game not found' };
  const title = gameTitle(game);
  return {
    title,
    description: DESCRIPTION,
    openGraph: { title, description: DESCRIPTION, type: 'website', siteName: 'Tracer' },
    twitter: { card: 'summary', title, description: DESCRIPTION },
  };
}

export default async function TracerGamePage({ params }: GamePageProps) {
  const { gameId } = await params;
  const game = await loadGameForPage(gameId);
  if (!game) notFound();
  return <TracerGameView key={game.id} initialGame={game} />;
}
