/**
 * Tracer by link, for people with no account: a signed-out visitor joins as
 * a guest just by typing a name, and another signed-out visitor can watch
 * the game live — which exercises the public-read Firestore rule.
 */

import { test, expect } from '../fixtures/auth';
import { createGameInLobby, inviteLink, submitTurn, tap } from '../fixtures/tracer';

test('a signed-out friend joins as a guest; a third visitor spectates', async ({ voter1Page: host, browser }) => {
  await createGameInLobby(host, { name: 'Hana', side: 'Black' });
  const link = await inviteLink(host);

  const guestContext = await browser.newContext();
  const guest = await guestContext.newPage();
  await guest.goto(link);
  await guest.getByLabel('Your name').fill('Gina');
  await guest.getByRole('button', { name: 'Join as White' }).click();
  await expect(guest.getByText('Your move.', { exact: true })).toBeVisible({ timeout: 20_000 });
  await expect(host.getByText('Waiting for Gina…')).toBeVisible({ timeout: 20_000 });

  const watcherContext = await browser.newContext();
  const watcher = await watcherContext.newPage();
  await watcher.goto(link);
  await expect(watcher.getByText(/Watching Gina vs Hana/)).toBeVisible({ timeout: 20_000 });

  // The guest moves; host and watcher both see it without reloading.
  await tap(guest, 'e2', 'e3');
  await submitTurn(guest);
  await expect(host.getByText('Your move.', { exact: true })).toBeVisible({ timeout: 20_000 });
  await expect(watcher.getByRole('button', { name: /^e3, White Warden/ })).toBeVisible();

  // A reload keeps the guest in their seat.
  await guest.reload();
  await expect(guest.getByText('Waiting for Hana…')).toBeVisible({ timeout: 20_000 });

  await guestContext.close();
  await watcherContext.close();
});
