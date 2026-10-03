import Link from 'next/link';

export default function TracerGameNotFound() {
  return (
    <main style={{ display: 'grid', gap: '0.75rem', padding: '2rem 1rem', maxWidth: '32rem', margin: '0 auto' }}>
      <h1>No game here</h1>
      <p>This link does not point to a Tracer game. It may have been mistyped.</p>
      <Link href="/tracer">Start a new game</Link>
    </main>
  );
}
