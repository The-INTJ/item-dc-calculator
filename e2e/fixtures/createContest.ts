/**
 * Admin-authenticated helper to create a contest + entries for a spec.
 *
 * Calls the real POST /api/contest/contests and POST /entries endpoints —
 * the same endpoints the admin UI uses. Consistent with the no-drift rule:
 *   ✅ setup MAY use real admin APIs (equivalent to the admin clicking
 *      through the admin UI manually before the test runs)
 *   ❌ spec BODIES still drive the app through real UI surfaces — never
 *      import this helper into a spec to "shortcut" a user action.
 *
 * Used by specs only in `beforeEach`/top-of-test setup.
 */

import { request } from '@playwright/test';

const AUTH_EMULATOR = 'http://127.0.0.1:9099';
const API_KEY = 'fake-api-key';
const BASE_URL = 'http://127.0.0.1:3000';
const ADMIN_EMAIL = 'admin@test.com';
const ADMIN_PASSWORD = 'admin123';

type Phase = 'set' | 'shake' | 'scored';

let cachedToken: { idToken: string; expiresAt: number } | null = null;

async function getAdminIdToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.idToken;
  }
  const url = `${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      returnSecureToken: true,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`admin signIn failed: ${res.status} ${body}`);
  }
  const json = (await res.json()) as { idToken: string; expiresIn: string };
  cachedToken = {
    idToken: json.idToken,
    expiresAt: Date.now() + Number(json.expiresIn) * 1000,
  };
  return json.idToken;
}

export interface EntryInput {
  name: string;
  submittedBy?: string;
  description?: string;
}

export interface CreateContestOptions {
  name?: string;
  slug?: string;
  phase?: Phase;
  activeRoundId?: string;
  roundName?: string;
  entries?: EntryInput[];
  attributes?: Array<{ id: string; label: string; min?: number; max?: number }>;
}

export interface CreatedContest {
  contestId: string;
  entries: Array<{ id: string; name: string }>;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function createContest(
  opts: CreateContestOptions = {},
): Promise<CreatedContest> {
  const suffix = Math.random().toString(36).slice(2, 8);
  const slug = opts.slug ?? `e2e-${suffix}`;
  const name = opts.name ?? `E2E Contest ${suffix}`;
  const phase: Phase = opts.phase ?? 'shake';
  const activeRoundId = opts.activeRoundId ?? 'round-1';
  const roundName = opts.roundName ?? 'Round 1';
  const entriesInput = opts.entries ?? [{ name: 'Paloma' }, { name: 'Margarita' }];
  const attributes = opts.attributes ?? [
    { id: 'taste', label: 'Taste', min: 1, max: 10 },
  ];

  const idToken = await getAdminIdToken();
  const api = await request.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: { Authorization: `Bearer ${idToken}` },
  });

  try {
    const contestBody = {
      name,
      slug,
      phase,
      config: {
        topic: 'Mixology',
        entryLabel: 'Drink',
        entryLabelPlural: 'Drinks',
        attributes,
      },
      rounds: [{ id: activeRoundId, name: roundName, number: 1, state: phase }],
      activeRoundId,
      futureRoundId: null,
    };

    const contestRes = await api.post('/api/contest/contests', { data: contestBody });
    if (!contestRes.ok()) {
      throw new Error(
        `createContest POST /contests: ${contestRes.status()} ${await contestRes.text()}`,
      );
    }
    const contestEnvelope = await contestRes.json();
    const contest = contestEnvelope?.data ?? contestEnvelope;
    const contestId: string | undefined = contest?.id;
    if (!contestId) {
      throw new Error(`createContest: missing id in response: ${JSON.stringify(contestEnvelope)}`);
    }

    const entries: Array<{ id: string; name: string }> = [];
    for (const entry of entriesInput) {
      const body = {
        name: entry.name,
        slug: slugify(entry.name),
        description: entry.description ?? `${entry.name} — e2e fixture`,
        round: activeRoundId,
        submittedBy: entry.submittedBy ?? 'Admin',
      };
      const res = await api.post(`/api/contest/contests/${contestId}/entries`, { data: body });
      if (!res.ok()) {
        throw new Error(
          `createContest POST /entries: ${res.status()} ${await res.text()}`,
        );
      }
      const envelope = await res.json();
      const created = envelope?.data ?? envelope;
      const id: string | undefined = created?.id;
      if (!id) {
        throw new Error(
          `createContest: missing entry id in response: ${JSON.stringify(envelope)}`,
        );
      }
      entries.push({ id, name: created?.name ?? entry.name });
    }

    return { contestId, entries };
  } finally {
    await api.dispose();
  }
}
