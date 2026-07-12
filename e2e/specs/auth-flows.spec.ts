/**
 * Real login-form flows — the storageState fixtures used by other specs
 * deliberately bypass the login UI (IndexedDB injection in global-setup), so
 * nothing else exercises /onboard's actual forms. These tests use plain
 * Playwright contexts with no injected auth.
 */

import { test, expect } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test('voter signs in through the email form and is bounced from /admin', async ({ page }) => {
  await page.goto('/onboard');
  await page.getByLabel('Email').fill('voter@test.com');
  await page.getByLabel('Password').fill('voter123');
  await page.getByRole('button', { name: /sign in with email/i }).click();

  await expect(page).toHaveURL(/\/contests/, { timeout: 20_000 });

  // Session cookie bridge: the server-rendered admin guard sees the voter
  // role and bounces — but not to /onboard (we ARE authenticated).
  await page.goto('/admin');
  await expect(page).not.toHaveURL(/\/admin$/);
  await expect(page).not.toHaveURL(/\/onboard/);

  // The account page reflects the seeded profile.
  await page.goto('/account');
  await expect(page.getByText('Firebase UID:')).toBeVisible();
  await expect(page.getByText(/Role:\s*voter/)).toBeVisible();
  await expect(page.getByText('Synced')).toBeVisible();
});

test('wrong password shows an inline error and does not navigate', async ({ page }) => {
  await page.goto('/onboard');
  await page.getByLabel('Email').fill('voter@test.com');
  await page.getByLabel('Password').fill('wrong-password');
  await page.getByRole('button', { name: /sign in with email/i }).click();

  await expect(page.locator('.auth-error')).toBeVisible({ timeout: 20_000 });
  await expect(page).toHaveURL(/\/onboard/);
});

test('admin signs in through the email form and reaches the dashboard', async ({ page }) => {
  await page.goto('/onboard');
  await page.getByLabel('Email').fill('admin@test.com');
  await page.getByLabel('Password').fill('admin123');
  await page.getByRole('button', { name: /sign in with email/i }).click();
  await expect(page).toHaveURL(/\/contests/, { timeout: 20_000 });

  // Server-rendered admin page allows the render — the __session cookie
  // minted during login carries the admin role.
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole('heading', { name: /admin dashboard/i })).toBeVisible();
});

test('signing out tears down both client state and the server session', async ({ page }) => {
  await page.goto('/onboard');
  await page.getByLabel('Email').fill('voter1@test.com');
  await page.getByLabel('Password').fill('voter123');
  await page.getByRole('button', { name: /sign in with email/i }).click();
  await expect(page).toHaveURL(/\/contests/, { timeout: 20_000 });

  await page.goto('/account');
  await expect(page.getByText('Firebase UID:')).toBeVisible();
  await page.getByRole('button', { name: /sign out/i }).click();

  // Client state: back to the signed-out menu.
  await expect(page.getByRole('button', { name: /^sign in$/i })).toBeVisible();
  await expect(page.getByText('Firebase UID:')).toHaveCount(0);

  // Server state: the admin guard treats us as anonymous again.
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/onboard/);
});
