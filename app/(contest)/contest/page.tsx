'use client';

import { AuthPrimaryAction, AdminOnlyLink } from '@/components/ui';

export default function MixologyPage() {
  return (
    <div className="contest-landing">
      <section className="contest-hero">
        <h1>Mixology Contest!</h1>
        <p>
          Sign in or create a profile to start rating drinks -- and even register as a Mixologist!
        </p>
        <div className="contest-actions">
          <AuthPrimaryAction
            signedOutLabel="Sign in or create an account"
            signedOutHref="/contest/onboard"
            className="button-primary"
          />
          <AdminOnlyLink href="/contest/admin" className="button-secondary">
            Admin dashboard
          </AdminOnlyLink>
        </div>
      </section>
    </div>
  );
}
