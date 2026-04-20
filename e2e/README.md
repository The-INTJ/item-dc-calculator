# End-to-end tests (Playwright)

Browser-level tests that drive the app through real user surfaces against a
real Firebase emulator. Complementary to the unit suite (`npm test`), not a
replacement.

## Running

```
npm run test:e2e:install    # one-time: install chromium binary
npm run test:e2e            # headless run
npm run test:e2e:ui         # Playwright UI mode (recommended for writing tests)
npm run test:e2e:headed     # watch the browser do its thing
npm run test:e2e:debug      # step through with the inspector
```

The `webServer` orchestration starts Firebase emulators (auth + firestore),
seeds test accounts, then launches `next dev --env-file .env.emulators`. When
Playwright stops the webServer, the whole process tree dies together.

If an orchestrated startup fails with port-in-use, kill any existing
`node`/`java`/`next` you have running on 3000/8080/9099 and retry.

## The no-drift rule

Tests must drive the app through the same surfaces a real user uses. A test
that bypasses the real UI or API path can pass while production breaks — the
exact failure mode we're trying to prevent.

**Allowed:**

- Test setup may call real admin APIs (the admin UI calls the same endpoints).
  See `e2e/fixtures/createContest.ts`.
- Emulator-level data reset between runs.
- Auth state seeding via the Firebase Auth emulator's REST sign-in endpoint
  (`e2e/global-setup.ts`) — equivalent to a human logging in, just automated.

**Not allowed:**

- Test-only API endpoints (e.g., `/api/test/seed-contest`). If the real admin
  UI can't do it, neither can a test.
- Direct provider calls from specs (e.g., importing `firestoreAdminAdapter`).
  Votes must go through clicks. Phase transitions must go through clicks.
- Mocked internals in E2E. Everything is real — real Firestore (emulator),
  real API, real React, real MUI.
- "Hidden" buttons added for tests. `data-testid` is fine on a real
  user-facing control; it is not a license to add invisible shortcuts.
- Modified copies of path-critical methods. If a helper named
  `submitVoteInUI` exists, it performs the same clicks a human performs —
  it does not call `contestApi.submitScore` under the hood.

This applies doubly for agentic automation. Any hook added to enable AI-driven
testing must mimic user surfaces (clicks, form fills, keyboard) — never invoke
path-critical methods directly.

## Auth

`e2e/global-setup.ts` signs in each seeded user (admin, voter1, voter2,
voter3) against the Firebase Auth emulator's REST endpoint, writes the
resulting auth record into IndexedDB via `page.addInitScript`, and saves the
context `storageState({ indexedDB: true })` to `e2e/.auth/<role>.json`. Specs
then load that state into `browser.newContext` via the `auth.ts` fixture.

Seeded accounts are defined in `scripts/seed-emulator.mjs`:

- `admin@test.com` / `admin123` — role `admin`
- `voter1@test.com` / `voter123` — role `voter`
- `voter2@test.com` / `voter123` — role `voter`
- `voter3@test.com` / `voter123` — role `voter`

## Fixtures

- `fixtures/auth.ts` — extends Playwright's `test` with `adminPage`,
  `voter1Page`, `voter2Page`, `voter3Page` — each a fresh `Page` in its own
  pre-authenticated `BrowserContext`.
- `fixtures/createContest.ts` — admin-authenticated contest + entries factory.
  Call from `beforeEach` or top-of-test setup.
- `fixtures/waitForTally.ts` — `expect.poll` wrapper for reading an entry's
  displayed aggregate score. Use instead of `page.waitForTimeout` — the
  onSnapshot listener is paced at 300ms.

## Common failure modes

**"signIn failed: 400 EMAIL_NOT_FOUND" in global-setup** — the seed didn't
run, or emulators were restarted without re-seeding. Restart the test run;
`scripts/e2e-dev.mjs` re-seeds on each start.

**Tally never matches expected** — the 300ms pacing means the first poll
often misses. `waitForEntryScore` polls for 15s by default. If it times out,
check the emulator UI (http://127.0.0.1:4000) to see whether the vote
actually landed in Firestore.

**"Target closed" / "Execution context was destroyed"** — a page was
navigated or a context was closed mid-assertion. Usually a sign of an await
missing on a previous step.

**Flaky first click after navigation** — React hydration hasn't finished.
Prefer a deterministic gate (wait for the dialog to open after clicking)
over `waitForTimeout`.

## Trace viewer

Failed runs produce a zip under `test-results/`. Open it with:

```
npx playwright show-trace test-results/<spec>/trace.zip
```

The trace shows every action with before/after screenshots, console logs,
and network calls — almost always enough to diagnose without re-running.

## Adding a spec

1. Put the file under `e2e/specs/`.
2. Import `test, expect` from `../fixtures/auth`.
3. Use `createContest` in setup to get an isolated contest per spec.
4. Drive the app through `page.getByRole`/`getByText` — no MUI class
   selectors, no direct provider calls.
5. Keep specs under ~150 lines. Split related flows into separate files.
