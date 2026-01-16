'use client';

import Link from 'next/link';
import { AuthPrimaryAction } from './components/AuthPrimaryAction';

export default function HomePage() {
  return (
    <div className="mixology-landing">
      <section className="mixology-hero">
        <h1>Mixology Rating App</h1>
        <p>
          A contest-first experience for voting, scoring, and tracking craft cocktail matchups.
          Sign in or create a profile to start rating drinks right away.
        </p>
        <div className="mixology-actions">
          <AuthPrimaryAction
            signedOutLabel="Sign in or create an account"
            signedOutHref="/mixology/onboard"
            className="button-primary"
          />
          <Link href="/mixology/admin" className="button-secondary">
            Admin dashboard
          </Link>
        </div>
      </section>

      <section className="mixology-panels">
        <div className="mixology-card">
          <h2>Login-first flow</h2>
          <p>
            The onboarding flow guides voters through guest access, Google sign-in, or creating a fresh
            profile so every rating is tied to the right person.
          </p>
        </div>
        <div className="mixology-card">
          <h2>Voter-ready experience</h2>
          <p>
            Move quickly from sign-in to voting, with a lightweight experience tuned for live event
            voting and tablet check-ins.
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
