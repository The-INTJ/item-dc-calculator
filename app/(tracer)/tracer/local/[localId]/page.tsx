import type { Metadata } from 'next';

import { LocalGameView } from '@/features/tracer';

export const metadata: Metadata = { title: 'Local game' };

interface LocalGamePageProps {
  params: Promise<{ localId: string }>;
}

/** A game on this device only — the board loads from this browser's storage. */
export default async function TracerLocalGamePage({ params }: LocalGamePageProps) {
  const { localId } = await params;
  return <LocalGameView key={localId} localId={localId} />;
}
