/**
 * Email/password registration through the real /onboard UI. Before the
 * campaign this flow was unreachable (the register form lived only in an
 * orphaned modal); these tests guard the wired-up path.
 */

import { test, expect } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test('a new user registers with email/password and lands as a synced voter', async ({ page }) => {
  const email = `e2e-reg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@test.com`;

  await page.goto('/onboard');
  await page.getByRole('button', { name: /need an account\? create one/i }).click();

  await page.getByLabel('Display Name').fill('Reg Tester');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('secret123');
  await page.getByLabel('Confirm Password').fill('secret123');
  await page.getByRole('button', { name: /^create account$/i }).click();

  await expect(page).toHaveURL(/\/contests/, { timeout: 20_000 });

  await page.goto('/account');
  await expect(page.getByText('Firebase UID:')).toBeVisible();
  await expect(page.getByText('Synced')).toBeVisible();
  await expect(page.getByText(/Role:\s*voter/)).toBeVisible();
  await expect(page.locator('.user-menu__name')).toHaveText('Reg Tester');
});

test('mismatched passwords surface an inline error without creating anything', async ({
  page,
}) => {
  await page.goto('/onboard');
  await page.getByRole('button', { name: /need an account\? create one/i }).click();

  await page.getByLabel('Display Name').fill('Mismatch');
  await page.getByLabel('Email').fill(`e2e-mismatch-${Date.now()}@test.com`);
  await page.getByLabel('Password', { exact: true }).fill('secret123');
  await page.getByLabel('Confirm Password').fill('different');
  await page.getByRole('button', { name: /^create account$/i }).click();

  await expect(page.locator('.auth-error')).toContainText(/passwords do not match/i);
  await expect(page).toHaveURL(/\/onboard/);
});

test('the register view can switch back to sign-in', async ({ page }) => {
  await page.goto('/onboard');
  await page.getByRole('button', { name: /need an account\? create one/i }).click();
  await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible();

  await page.getByRole('button', { name: /back to sign in/i }).click();
  await expect(page.getByRole('button', { name: /sign in with email/i })).toBeVisible();
});
