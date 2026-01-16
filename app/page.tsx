'use client';

import Link from 'next/link';
import { useAuth } from '@/src/mixology/auth';

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const primaryHref = isAuthenticated ? '/mixology/bracket' : '/mixology/onboard';
  const primaryLabel = isAuthenticated ? 'Go to Bracket' : 'Sign in or create an account';

  return (
    <div className="mixology-landing">
      <section className="mixology-hero">
        <h1>Mixology Rating App</h1>
        <p>
          A contest-first experience for judging, scoring, and tracking craft cocktail matchups.
          Sign in or create your judge profile to start rating drinks right away.
        </p>
        <div className="mixology-actions">
          <Link href={primaryHref} className="button-primary">
            {primaryLabel}
          </Link>
          <Link href="/mixology/admin" className="button-secondary">
            Admin dashboard
          </Link>
        </div>
      </section>

      <section className="mixology-panels">
        <div className="mixology-card">
          <h2>Login-first flow</h2>
          <p>
            The onboarding flow guides judges through guest access, Google sign-in, or creating a fresh
            profile so every rating is tied to the right person.
          </p>
        </div>
        <div className="mixology-card">
          <h2>Judge-ready experience</h2>
          <p>
            Move quickly from sign-in to voting, with a lightweight experience tuned for live event
            judging and tablet check-ins.
          </p>
        </div>
        <div className="mixology-card">
          <h2>Admin visibility</h2>
          <p>
            Administrators can jump straight into contest setup and oversight from the dashboard.
          </p>
        </div>
      </section>
    </div>
  );
}
