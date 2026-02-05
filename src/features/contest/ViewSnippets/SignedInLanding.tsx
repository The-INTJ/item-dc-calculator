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
    <div className="contest-landing">
      <section className="contest-hero">
        <h1>Welcome back, {user.displayName}!</h1>
        <p>
          Jump back into the action. Continue rating entries, check your progress,
          or explore ongoing contests.
        </p>
        <div className="contest-actions">
          <Link href="/contest/vote" className="button-primary">
            Start voting
          </Link>
          <Link href="/contest/account" className="button-secondary">
            View profile
          </Link>
          <AdminOnlyLink
            href="/contest/admin"
            className="button-secondary"
            dataTestId="contest-admin-link"
          >
            Admin dashboard
          </AdminOnlyLink>
        </div>
      </section>
    </div>
  );
}
