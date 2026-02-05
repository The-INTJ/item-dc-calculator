/**
 * SignedInLanding - Landing experience for authenticated users
 */

import Link from 'next/link';
import { AdminOnlyLink } from '@/components/ui';
import type { UserProfile } from '../contexts/auth/types';

interface SignedInLandingProps {
  user: UserProfile;
}

export default function SignedInLanding({ user }: SignedInLandingProps) {
  return (
    <div className="mixology-landing">
      <section className="mixology-hero">
        <h1>Welcome back, {user.displayName}!</h1>
        <p>
          Jump back into the action. Continue rating drinks, check your progress,
          or explore ongoing contests.
        </p>
        <div className="mixology-actions">
          <Link href="/mixology/vote" className="button-primary">
            Start voting
          </Link>
          <Link href="/mixology/account" className="button-secondary">
            View profile
          </Link>
          <AdminOnlyLink
            href="/mixology/admin"
            className="button-secondary"
            dataTestId="mixology-admin-link"
          >
            Admin dashboard
          </AdminOnlyLink>
        </div>
      </section>
    </div>
  );
}
