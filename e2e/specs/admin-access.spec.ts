/**
 * Admin access E2E — guards the session-cookie bridge.
 *
 * Regression: before the /api/contest/auth/session endpoint was added, the
 * `AdminOnlyLink` component relied on client-side role detection (which
 * worked) but the server-rendered `/admin` page relied on a `__session`
 * cookie that no code path produced. Admins saw the link, clicked it, and
 * were redirected to /onboard as if unauthenticated.
 *
 * This spec exercises the full server-rendered redirect path for admin,
 * voter, and unauthenticated roles. If it passes, the session-cookie bridge
 * is producing the cookie and server auth is consistent with client auth.
 *
 * Drives the app through real UI surfaces per the no-drift rule
 * (e2e/README.md).
 */

import { test, expect } from '../fixtures/auth';
import { createContest } from '../fixtures/createContest';
import { test as anonymousTest } from '@playwright/test';

test('admin can open /admin via the landing page link', async ({ adminPage }) => {
  await adminPage.goto('/');

  const adminLink = adminPage.getByTestId('contest-admin-link');
  await expect(adminLink).toBeVisible();

  await adminLink.click();

  // Server guard should allow this render, not redirect.
  await expect(adminPage).toHaveURL(/\/admin$/);
  await expect(adminPage.getByRole('heading', { name: /admin dashboard/i })).toBeVisible();
});

test('admin can deep-link directly to /admin without a redirect', async ({ adminPage }) => {
  await adminPage.goto('/admin', { waitUntil: 'domcontentloaded' });

  await expect(adminPage).toHaveURL(/\/admin$/);
  await expect(adminPage.getByRole('heading', { name: /admin dashboard/i })).toBeVisible();
});

test('non-admin voter does not see the admin link', async ({ voter1Page }) => {
  await voter1Page.goto('/');
  await expect(voter1Page.getByTestId('contest-admin-link')).toHaveCount(0);
});

test('non-admin voter deep-linking /admin is redirected away from /admin', async ({
  voter1Page,
}) => {
  await voter1Page.goto('/admin', { waitUntil: 'domcontentloaded' });

  // Server guard should bounce non-admins — either to /contests (correct
  // branch: authenticated but not admin) or to /onboard. Either way, the
  // admin dashboard must not render.
  await expect(voter1Page).not.toHaveURL(/\/admin$/);
  await expect(voter1Page.getByRole('heading', { name: /admin dashboard/i })).toHaveCount(0);
});

anonymousTest(
  'unauthenticated user deep-linking /admin is redirected to /onboard',
  async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/onboard/);
  },
);

test('admin sees per-matchup phase controls and a force-close round override', async ({
  adminPage,
}) => {
  const suffix = Math.random().toString(36).slice(2, 8);
  const contestName = `Admin Controls ${suffix}`;
  await createContest({
    name: contestName,
    matchups: [{ entryNames: [`Alpha-${suffix}`, `Bravo-${suffix}`], phase: 'shake' }],
  });

  await adminPage.goto('/admin', { waitUntil: 'domcontentloaded' });
  await expect(adminPage.getByRole('heading', { name: /admin dashboard/i })).toBeVisible();

  // Pick our freshly-created contest out of the sidebar.
  await adminPage.getByRole('button', { name: new RegExp(contestName, 'i') }).click();

  // Expand the round to reveal the matchup controls.
  const roundHeader = adminPage.getByRole('button', { name: /Round 1/i }).first();
  await expect(roundHeader).toBeVisible();
  await roundHeader.click();

  // Per-matchup phase selector — three toggle buttons labelled by phase.
  const matchupBlock = adminPage.locator('.admin-round-entry').first();
  await expect(matchupBlock).toBeVisible();
  await expect(matchupBlock.getByRole('button', { name: /^Set$/ })).toBeVisible();
  const shakeButton = matchupBlock.getByRole('button', { name: /^Shake$/ });
  await expect(shakeButton).toBeVisible();
  await expect(shakeButton).toHaveAttribute('aria-pressed', 'true');
  await expect(matchupBlock.getByRole('button', { name: /^Scored$/ })).toBeVisible();

  // Admin can force-close the round — the escape hatch is always visible when no override is set.
  await expect(adminPage.getByRole('button', { name: /force close/i })).toBeVisible();
  await expect(adminPage.getByRole('button', { name: /force open/i })).toBeVisible();
});
