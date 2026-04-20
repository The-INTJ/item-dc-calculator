/**
 * Extends Playwright's `test` with pre-authenticated browser contexts per role.
 *
 * Each fixture opens a new `browser.newContext` seeded with the storageState
 * captured by e2e/global-setup.ts (IndexedDB-backed Firebase auth record).
 *
 * This is test INFRASTRUCTURE — specs still drive the app through real UI,
 * per the no-drift rule in e2e/README.md.
 */

import { test as base, type BrowserContext, type Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const AUTH_DIR = path.join(HERE, '..', '.auth');

const storageStateFor = (role: string) => path.join(AUTH_DIR, `${role}.json`);

interface RoleFixtures {
  adminContext: BrowserContext;
  adminPage: Page;
  voter1Context: BrowserContext;
  voter1Page: Page;
  voter2Context: BrowserContext;
  voter2Page: Page;
  voter3Context: BrowserContext;
  voter3Page: Page;
}

export const test = base.extend<RoleFixtures>({
  adminContext: async ({ browser }, use) => {
    const ctx = await browser.newContext({ storageState: storageStateFor('admin') });
    await use(ctx);
    await ctx.close();
  },
  adminPage: async ({ adminContext }, use) => {
    const page = await adminContext.newPage();
    await use(page);
  },
  voter1Context: async ({ browser }, use) => {
    const ctx = await browser.newContext({ storageState: storageStateFor('voter1') });
    await use(ctx);
    await ctx.close();
  },
  voter1Page: async ({ voter1Context }, use) => {
    const page = await voter1Context.newPage();
    await use(page);
  },
  voter2Context: async ({ browser }, use) => {
    const ctx = await browser.newContext({ storageState: storageStateFor('voter2') });
    await use(ctx);
    await ctx.close();
  },
  voter2Page: async ({ voter2Context }, use) => {
    const page = await voter2Context.newPage();
    await use(page);
  },
  voter3Context: async ({ browser }, use) => {
    const ctx = await browser.newContext({ storageState: storageStateFor('voter3') });
    await use(ctx);
    await ctx.close();
  },
  voter3Page: async ({ voter3Context }, use) => {
    const page = await voter3Context.newPage();
    await use(page);
  },
});

export { expect } from '@playwright/test';
