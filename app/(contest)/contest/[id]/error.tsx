'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function ContestPageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[ContestPageError]', error);
  }, [error]);

  return (
    <div className="contest-detail-page">
      <section className="contest-detail-header">
        <h1>This contest can't be displayed</h1>
        <p>
          It looks like this contest was created on an older version of the app
          and is missing some fields. Try a newer contest, or ask an admin to
          remove it.
        </p>
      </section>
      <div className="contest-actions" style={{ display: 'flex', gap: '0.5rem' }}>
        <button type="button" className="btn btn--primary" onClick={reset}>
          Try again
        </button>
        <Link href="/" className="btn btn--secondary">
          Back to home
        </Link>
      </div>
    </div>
  );
}
