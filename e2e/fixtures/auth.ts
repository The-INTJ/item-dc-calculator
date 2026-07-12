/**
 * Extends Playwright's `test` with pre-authenticated browser contexts per role.
 *
 * Each fixture opens a new `browser.newContext` seeded with the storageState
 * captured by e2e/global-setup.ts (IndexedDB-backed Firebase auth record).
 * The project's `contextOptions` are spread in so device projects (e.g. the
 * Pixel 7 mobile project) apply their viewport/UA to these contexts too.
 *
 * Playwright statically analyzes these fixtures, so each MUST destructure its
 * dependencies inline in the first argument (no extracted factory helpers).
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
  voterContext: BrowserContext;
  voterPage: Page;
  voter1Context: BrowserContext;
  voter1Page: Page;
  voter2Context: BrowserContext;
  voter2Page: Page;
  voter3Context: BrowserContext;
  voter3Page: Page;
  voter4Context: BrowserContext;
  voter4Page: Page;
  voter5Context: BrowserContext;
  voter5Page: Page;
}

export const test = base.extend<RoleFixtures>({
  adminContext: async ({ browser, contextOptions }, use) => {
    const ctx = await browser.newContext({ ...contextOptions, storageState: storageStateFor('admin') });
    await use(ctx);
    await ctx.close();
  },
  adminPage: async ({ adminContext }, use) => {
    await use(await adminContext.newPage());
  },
  voterContext: async ({ browser, contextOptions }, use) => {
    const ctx = await browser.newContext({ ...contextOptions, storageState: storageStateFor('voter') });
    await use(ctx);
    await ctx.close();
  },
  voterPage: async ({ voterContext }, use) => {
    await use(await voterContext.newPage());
  },
  voter1Context: async ({ browser, contextOptions }, use) => {
    const ctx = await browser.newContext({ ...contextOptions, storageState: storageStateFor('voter1') });
    await use(ctx);
    await ctx.close();
  },
  voter1Page: async ({ voter1Context }, use) => {
    await use(await voter1Context.newPage());
  },
  voter2Context: async ({ browser, contextOptions }, use) => {
    const ctx = await browser.newContext({ ...contextOptions, storageState: storageStateFor('voter2') });
    await use(ctx);
    await ctx.close();
  },
  voter2Page: async ({ voter2Context }, use) => {
    await use(await voter2Context.newPage());
  },
  voter3Context: async ({ browser, contextOptions }, use) => {
    const ctx = await browser.newContext({ ...contextOptions, storageState: storageStateFor('voter3') });
    await use(ctx);
    await ctx.close();
  },
  voter3Page: async ({ voter3Context }, use) => {
    await use(await voter3Context.newPage());
  },
  voter4Context: async ({ browser, contextOptions }, use) => {
    const ctx = await browser.newContext({ ...contextOptions, storageState: storageStateFor('voter4') });
    await use(ctx);
    await ctx.close();
  },
  voter4Page: async ({ voter4Context }, use) => {
    await use(await voter4Context.newPage());
  },
  voter5Context: async ({ browser, contextOptions }, use) => {
    const ctx = await browser.newContext({ ...contextOptions, storageState: storageStateFor('voter5') });
    await use(ctx);
    await ctx.close();
  },
  voter5Page: async ({ voter5Context }, use) => {
    await use(await voter5Context.newPage());
  },
});

export { expect } from '@playwright/test';
