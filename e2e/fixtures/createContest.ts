/**
 * Admin-authenticated helper to create a contest + matchups for a spec.
 *
 * Calls the real admin endpoints — the same ones the admin UI uses. Consistent
 * with the no-drift rule:
 *   ✅ setup MAY use real admin APIs (equivalent to the admin clicking through
 *      the admin UI manually before the test runs)
 *   ❌ spec BODIES still drive the app through real UI surfaces — never import
 *      this helper into a spec to "shortcut" a user action.
 *
 * Flow mirrors the admin-UI sequence:
 *   1. POST /api/contest/contests                         — create shell
 *   2. PATCH /api/contest/contests/{id} (rounds: [...])   — add the round
 *   3. POST /api/contest/contests/{id}/entries (× N)      — flat entries
 *   4. POST /api/contest/contests/{id}/rounds/{rid}/seed  — create matchups
 *   5. PATCH /api/contest/contests/{id}/matchups/{mid}    — set phase per matchup
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

export interface MatchupInput {
  entryNames: [string, string];
  phase?: Phase;
  descriptions?: [string, string];
  submittedBy?: [string, string];
}

export interface CreateContestOptions {
  name?: string;
  slug?: string;
  roundId?: string;
  roundName?: string;
  matchups?: MatchupInput[];
  attributes?: Array<{ id: string; label: string; min?: number; max?: number }>;
}

export interface CreatedContest {
  contestId: string;
  roundId: string;
  entries: Array<{ id: string; name: string }>;
  matchups: Array<{ id: string; entryIds: [string, string]; phase: Phase }>;
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
  const roundId = opts.roundId ?? 'round-1';
  const roundName = opts.roundName ?? 'Round 1';
  const matchupInputs: MatchupInput[] = opts.matchups ?? [
    { entryNames: ['Paloma', 'Margarita'], phase: 'shake' },
  ];
  const attributes = opts.attributes ?? [
    { id: 'taste', label: 'Taste', min: 1, max: 10 },
  ];

  const idToken = await getAdminIdToken();
  const api = await request.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: { Authorization: `Bearer ${idToken}` },
  });

  try {
    // Step 1 — create the contest shell.
    const contestRes = await api.post('/api/contest/contests', {
      data: {
        name,
        slug,
        config: {
          topic: 'Mixology',
          entryLabel: 'Drink',
          entryLabelPlural: 'Drinks',
          attributes,
        },
      },
    });
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

    // Step 2 — add the round (no state; rounds are lightweight now).
    const patchRes = await api.patch(`/api/contest/contests/${contestId}`, {
      data: {
        rounds: [{ id: roundId, name: roundName, number: 1 }],
      },
    });
    if (!patchRes.ok()) {
      throw new Error(
        `createContest PATCH /contests/${contestId}: ${patchRes.status()} ${await patchRes.text()}`,
      );
    }

    // Step 3 — create entries (flat; no round assignment at the entry level).
    const uniqueEntryInputs = collectUniqueEntries(matchupInputs);
    const entriesByName = new Map<string, { id: string; name: string }>();
    for (const input of uniqueEntryInputs) {
      const body = {
        name: input.name,
        slug: slugify(input.name),
        description: input.description,
        submittedBy: input.submittedBy,
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
      entriesByName.set(input.name, { id, name: created?.name ?? input.name });
    }

    // Step 4 — seed the round with explicit entry pairs.
    const entryIdPairs: Array<[string, string]> = matchupInputs.map((m) => {
      const a = entriesByName.get(m.entryNames[0])?.id;
      const b = entriesByName.get(m.entryNames[1])?.id;
      if (!a || !b) {
        throw new Error(
          `createContest: missing entry id for matchup ${m.entryNames.join(' vs ')}`,
        );
      }
      return [a, b];
    });

    const seedRes = await api.post(
      `/api/contest/contests/${contestId}/rounds/${roundId}/seed`,
      { data: { entryIdPairs } },
    );
    if (!seedRes.ok()) {
      throw new Error(
        `createContest POST /rounds/${roundId}/seed: ${seedRes.status()} ${await seedRes.text()}`,
      );
    }
    const seedEnvelope = await seedRes.json();
    const seeded = seedEnvelope?.data?.matchups ?? seedEnvelope?.matchups ?? [];
    const seededMatchups: Array<{
      id: string;
      entryIds: [string, string];
      phase: Phase;
      slotIndex: number;
    }> = seeded.map((m: { id: string; entryIds: string[]; phase: Phase; slotIndex: number }) => ({
      id: m.id,
      entryIds: [m.entryIds[0], m.entryIds[1]] as [string, string],
      phase: m.phase,
      slotIndex: m.slotIndex,
    }));
    seededMatchups.sort((a, b) => a.slotIndex - b.slotIndex);

    // Step 5 — promote each matchup to its requested phase.
    const resolvedMatchups: Array<{ id: string; entryIds: [string, string]; phase: Phase }> = [];
    for (let i = 0; i < seededMatchups.length; i += 1) {
      const seededMatchup = seededMatchups[i];
      const requestedPhase: Phase = matchupInputs[i]?.phase ?? 'set';
      if (requestedPhase !== seededMatchup.phase) {
        const patchMatchupRes = await api.patch(
          `/api/contest/contests/${contestId}/matchups/${seededMatchup.id}`,
          { data: { phase: requestedPhase } },
        );
        if (!patchMatchupRes.ok()) {
          throw new Error(
            `createContest PATCH /matchups/${seededMatchup.id}: ${patchMatchupRes.status()} ${await patchMatchupRes.text()}`,
          );
        }
      }
      resolvedMatchups.push({
        id: seededMatchup.id,
        entryIds: seededMatchup.entryIds,
        phase: requestedPhase,
      });
    }

    return {
      contestId,
      roundId,
      entries: Array.from(entriesByName.values()),
      matchups: resolvedMatchups,
    };
  } finally {
    await api.dispose();
  }
}

interface EntryCreateInput {
  name: string;
  description: string;
  submittedBy: string;
}

function collectUniqueEntries(matchups: MatchupInput[]): EntryCreateInput[] {
  const seen = new Map<string, EntryCreateInput>();
  for (const matchup of matchups) {
    for (let i = 0; i < 2; i += 1) {
      const name = matchup.entryNames[i];
      if (seen.has(name)) continue;
      seen.set(name, {
        name,
        description: matchup.descriptions?.[i] ?? `${name} — e2e fixture`,
        submittedBy: matchup.submittedBy?.[i] ?? 'Admin',
      });
    }
  }
  return Array.from(seen.values());
}
