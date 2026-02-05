'use client';

import { AuthPrimaryAction, AdminOnlyLink } from '@/components/ui';

export default function ContestPage() {
  return (
    <div className="contest-landing">
      <section className="contest-hero">
        <h1>Contest App</h1>
        <p>
          Sign in or create a profile to start rating entries and track the competition!
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
