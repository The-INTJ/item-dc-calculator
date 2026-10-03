'use client';

import Link from 'next/link';

export default function TracerGameError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main style={{ display: 'grid', gap: '0.75rem', padding: '2rem 1rem', maxWidth: '32rem', margin: '0 auto' }}>
      <h1>The game could not load</h1>
      <p>The game server may be unavailable for a moment.</p>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button type="button" onClick={reset} style={{ minHeight: 44, padding: '0 1rem' }}>
          Try again
        </button>
        <Link href="/tracer">Back to the lobby</Link>
      </div>
    </main>
  );
}
