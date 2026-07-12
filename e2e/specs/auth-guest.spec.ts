/**
 * Guest lifecycle: entry, reload persistence (the guest-rehydration bug made
 * reloads silently flip guests to "Synced"), and the account-linking upgrade
 * that keeps the same Firebase uid — votes and registrations survive.
 */

import { test, expect, type Page } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

async function startGuestSession(page: Page, name: string): Promise<void> {
  await page.goto('/onboard');
  await page.getByLabel(/your name/i).fill(name);
  await page.getByRole('button', { name: /continue anonymously/i }).click();
  await expect(page).toHaveURL(/\/contests/, { timeout: 20_000 });
}

async function readUid(page: Page): Promise<string> {
  const uidRow = page.locator('.account-debug div', { hasText: 'Firebase UID:' });
  const text = await uidRow.textContent();
  return (text ?? '').replace('Firebase UID:', '').trim();
}

test('guest entry shows Guest status and SURVIVES a reload as a guest', async ({ page }) => {
  await startGuestSession(page, 'Reload Guest');

  await page.goto('/account');
  await expect(page.getByText('Firebase UID:')).toBeVisible();
  await expect(page.getByText('Guest', { exact: true })).toBeVisible();
  const uid = await readUid(page);

  // The rehydration bug flipped this to "Synced" after reload.
  await page.reload();
  await expect(page.getByText('Firebase UID:')).toBeVisible();
  await expect(page.getByText('Guest', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
  expect(await readUid(page)).toBe(uid);
});

test('guest upgrade links credentials onto the SAME uid and survives re-login', async ({
  page,
}) => {
  const email = `e2e-upgrade-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@test.com`;

  await startGuestSession(page, 'Upgrade Guest');
  await page.goto('/account');
  await expect(page.getByText('Firebase UID:')).toBeVisible();
  const guestUid = await readUid(page);

  // The guest upgrade CTA routes to onboarding's upgrade form.
  await page.getByRole('button', { name: /create account/i }).click();
  await expect(page).toHaveURL(/\/onboard/);
  await expect(page.getByRole('heading', { name: /make your account permanent/i })).toBeVisible();

  await page.getByLabel('Display Name').fill('Upgraded User');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('secret123');
  await page.getByLabel('Confirm Password').fill('secret123');
  await page.getByRole('button', { name: /^upgrade account$/i }).click();

  await expect(page).toHaveURL(/\/contests/, { timeout: 20_000 });
  await page.goto('/account');
  await expect(page.getByText('Synced')).toBeVisible();
  // Account linking preserves the uid — this is what keeps their votes.
  expect(await readUid(page)).toBe(guestUid);

  // The linked credentials are a real login: sign out, sign back in.
  await page.getByRole('button', { name: /sign out/i }).click();
  await expect(page.getByRole('button', { name: /^sign in$/i })).toBeVisible();

  await page.goto('/onboard');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('secret123');
  await page.getByRole('button', { name: /sign in with email/i }).click();
  await expect(page).toHaveURL(/\/contests/, { timeout: 20_000 });

  await page.goto('/account');
  await expect(page.getByText('Synced')).toBeVisible();
  expect(await readUid(page)).toBe(guestUid);
});
