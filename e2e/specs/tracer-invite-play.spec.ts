/**
 * Tracer, two players in two browsers: create from the lobby, share the
 * invite link, join, and alternate turns — each move reaching the other
 * board live through Firestore.
 */

import { test, expect } from '../fixtures/auth';
import { chart, createGameInLobby, expectYourMove, inviteLink, square, submitTurn, tap } from '../fixtures/tracer';

test('invite a friend by link and trade live turns', async ({ voter1Page: alice, voter2Page: bob }) => {
  await createGameInLobby(alice, { name: 'Alice', side: 'White' });
  await expect(alice.getByText('Waiting for an opponent')).toBeVisible();
  const link = await inviteLink(alice);

  await bob.goto(link);
  await expect(bob.getByText(/Alice wants a game/)).toBeVisible();
  await bob.getByLabel('Your name').fill('Bob');
  await bob.getByRole('button', { name: 'Join as Black' }).click();
  await expect(bob.getByText('Waiting for Alice…')).toBeVisible({ timeout: 20_000 });

  // Alice's 3-step Tracer charts b1 → b2 → b3, over her own Warden: a jumper.
  await expectYourMove(alice);
  await chart(alice, 'b1', ['b2', 'b3']);
  await expect(alice.getByText(/Tracer charts a jumper b1 → b3/)).toBeVisible();
  await submitTurn(alice);

  // Bob sees it arrive, then answers with a warden step plus a free king step.
  await expectYourMove(bob);
  await expect(square(bob, 'b3')).toHaveAccessibleName(/White 3-step Tracer, jumper/);
  await tap(bob, 'd7', 'd6', 'e8', 'f8');
  await expect(bob.getByText(/Warden d7 → d6, then King steps e8 → f8/)).toBeVisible();
  await submitTurn(bob);

  await expectYourMove(alice);
  await expect(square(alice, 'f8')).toHaveAccessibleName(/Black King/);
  // Black's king wasn't threatened, so the step is no dodge: no dodge count.
  await expect(alice.getByText(/^Dodges \d/)).toHaveCount(0);

  await alice.getByRole('tab', { name: 'Moves' }).click();
  await expect(alice.getByText('1. Tb1~b3 J88')).toBeVisible();
  await expect(alice.getByText('1… Wd7-d6 (Ke8-f8)')).toBeVisible();

  // The king borrows the Tracer's pattern.
  await alice.getByRole('tab', { name: 'Kings' }).click();
  await expect(alice.getByText('Alice’s king borrows')).toBeVisible();
  await expect(alice.getByText('current pattern')).toBeVisible();
});
