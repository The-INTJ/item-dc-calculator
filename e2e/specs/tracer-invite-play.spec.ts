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

  // Alice charts b1 → b2 → b3 → b4: it passes her own warden, so it is a jumper.
  await expectYourMove(alice);
  await chart(alice, 'b1', ['b2', 'b3', 'b4']);
  await expect(alice.getByText(/Tracer charts a jumper b1 → b4/)).toBeVisible();
  await submitTurn(alice);

  // Bob sees it arrive, then answers with a warden step plus a free king step.
  await expectYourMove(bob);
  await expect(square(bob, 'b4')).toHaveAccessibleName(/White Tracer, jumper/);
  await tap(bob, 'd7', 'd6', 'd8', 'e8');
  await expect(bob.getByText(/Warden d7 → d6, then King steps d8 → e8/)).toBeVisible();
  await submitTurn(bob);

  await expectYourMove(alice);
  await expect(square(alice, 'e8')).toHaveAccessibleName(/Black King/);
  await expect(alice.getByText('Dodges 1/6')).toBeVisible();

  await alice.getByRole('tab', { name: 'Moves' }).click();
  await expect(alice.getByText('1. Tb1~b4 J888*')).toBeVisible();
  await expect(alice.getByText('1… Wd7-d6 (Kd8-e8)')).toBeVisible();

  await alice.getByRole('tab', { name: 'Libraries' }).click();
  await expect(alice.getByText(/Alice’s king · 1 pattern/)).toBeVisible();
});
