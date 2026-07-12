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
 * Flow mirrors the admin-UI sequence (contestant-first model):
 *   1. POST /api/contest/contests                              — create shell
 *   2. PATCH /api/contest/contests/{id} (rounds: [...])        — add rounds
 *   3. POST /api/contest/contests/{id}/contestants (× N)       — one per drink
 *   4. POST /api/contest/contests/{id}/rounds/{rid}/seed       — contestant-id
 *      pairs (a 1-tuple seeds a bye, auto-scored with its lone entry as winner)
 *   5. PUT /api/contest/contests/{id}/matchups/{mid}/entries/{eid}
 *                                                              — name each drink
 *   6. PATCH /api/contest/contests/{id}/matchups/{mid}         — phase / winner
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
  /** Drink names — a 2-tuple is a regular matchup, a 1-tuple is a bye. */
  entryNames: [string] | [string, string];
  phase?: Phase;
  descriptions?: string[];
  /** Record this drink as the winner (also marks the matchup scored). */
  winnerEntryName?: string;
}

export interface ContestRoundInput {
  id: string;
  name: string;
  number?: number;
}

export interface ContestConfigInput {
  topic: string;
  entryLabel?: string;
  entryLabelPlural?: string;
  contestantLabel?: string;
  contestantLabelPlural?: string;
  attributes: Array<{ id: string; label: string; min?: number; max?: number; description?: string }>;
}

export interface CreateContestOptions {
  name?: string;
  slug?: string;
  roundId?: string;
  roundName?: string;
  rounds?: ContestRoundInput[];
  matchups?: MatchupInput[];
  config?: ContestConfigInput;
  attributes?: Array<{ id: string; label: string; min?: number; max?: number }>;
}

export interface CreatedContest {
  contestId: string;
  roundId: string;
  roundIds: string[];
  contestants: Array<{ id: string; displayName: string }>;
  entries: Array<{ id: string; name: string; matchupId: string }>;
  matchups: Array<{
    id: string;
    entryIds: string[];
    entryNames: string[];
    phase: Phase;
    slotIndex: number;
    isBye: boolean;
  }>;
}

interface SeededEntry {
  id: string;
  contestantId: string;
  name?: string;
}

interface SeededMatchup {
  id: string;
  entries: SeededEntry[];
  phase: Phase;
  slotIndex: number;
}

export async function createContest(
  opts: CreateContestOptions = {},
): Promise<CreatedContest> {
  const suffix = Math.random().toString(36).slice(2, 8);
  const slug = opts.slug ?? `e2e-${suffix}`;
  const name = opts.name ?? `E2E Contest ${suffix}`;
  const roundId = opts.roundId ?? 'round-1';
  const roundName = opts.roundName ?? 'Round 1';
  const rounds = opts.rounds ?? [{ id: roundId, name: roundName, number: 1 }];
  const firstRoundId = rounds[0]?.id ?? roundId;
  const matchupInputs: MatchupInput[] = opts.matchups ?? [
    { entryNames: ['Paloma', 'Margarita'], phase: 'shake' },
  ];
  const attributes = opts.attributes ?? [
    { id: 'taste', label: 'Taste', min: 1, max: 10 },
  ];
  const config = opts.config ?? {
    topic: 'Mixology',
    entryLabel: 'Drink',
    entryLabelPlural: 'Drinks',
    attributes,
  };

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
        config,
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

    // Step 2 — add the rounds (no state; rounds are lightweight now).
    const patchRes = await api.patch(`/api/contest/contests/${contestId}`, {
      data: {
        rounds,
      },
    });
    if (!patchRes.ok()) {
      throw new Error(
        `createContest PATCH /contests/${contestId}: ${patchRes.status()} ${await patchRes.text()}`,
      );
    }

    if (matchupInputs.length === 0) {
      return {
        contestId,
        roundId: firstRoundId,
        roundIds: rounds.map((round) => round.id),
        contestants: [],
        entries: [],
        matchups: [],
      };
    }

    // Step 3 — create one contestant per unique drink name.
    const drinkNames = collectUniqueDrinkNames(matchupInputs);
    const contestantIdByDrink = new Map<string, string>();
    for (const drinkName of drinkNames) {
      const res = await api.post(`/api/contest/contests/${contestId}/contestants`, {
        data: { displayName: drinkName },
      });
      if (!res.ok()) {
        throw new Error(
          `createContest POST /contestants: ${res.status()} ${await res.text()}`,
        );
      }
      const envelope = await res.json();
      const created = envelope?.data ?? envelope;
      const id: string | undefined = created?.id;
      if (!id) {
        throw new Error(
          `createContest: missing contestant id in response: ${JSON.stringify(envelope)}`,
        );
      }
      contestantIdByDrink.set(drinkName, id);
    }
    const drinkByContestantId = new Map(
      Array.from(contestantIdByDrink.entries()).map(([drink, id]) => [id, drink]),
    );

    // Step 4 — seed the round with explicit contestant-id slots (1-tuple = bye).
    const entryIdPairs: Array<[string, string] | [string]> = matchupInputs.map((m) => {
      const ids = m.entryNames.map((drink) => {
        const id = contestantIdByDrink.get(drink);
        if (!id) {
          throw new Error(`createContest: missing contestant id for drink ${drink}`);
        }
        return id;
      });
      return ids.length === 1 ? [ids[0]] : [ids[0], ids[1]];
    });

    const seedRes = await api.post(
      `/api/contest/contests/${contestId}/rounds/${firstRoundId}/seed`,
      { data: { entryIdPairs } },
    );
    if (!seedRes.ok()) {
      throw new Error(
        `createContest POST /rounds/${firstRoundId}/seed: ${seedRes.status()} ${await seedRes.text()}`,
      );
    }
    const seedEnvelope = await seedRes.json();
    const seeded: SeededMatchup[] = (seedEnvelope?.data?.matchups ?? seedEnvelope?.matchups ?? [])
      .map((m: SeededMatchup) => ({
        id: m.id,
        entries: m.entries ?? [],
        phase: m.phase,
        slotIndex: m.slotIndex,
      }))
      .sort((a: SeededMatchup, b: SeededMatchup) => a.slotIndex - b.slotIndex);

    // Step 5 — name each drink through the real entry-naming endpoint.
    const allEntries: CreatedContest['entries'] = [];
    for (const matchup of seeded) {
      for (const entry of matchup.entries) {
        const drink = drinkByContestantId.get(entry.contestantId);
        if (!drink) continue;
        const input = matchupInputs.find((m) => m.entryNames.includes(drink as never));
        const description = input?.descriptions?.[input.entryNames.indexOf(drink as never)];
        const res = await api.put(
          `/api/contest/contests/${contestId}/matchups/${matchup.id}/entries/${entry.id}`,
          { data: { name: drink, ...(description ? { description } : {}) } },
        );
        if (!res.ok()) {
          throw new Error(
            `createContest PUT /matchups/${matchup.id}/entries/${entry.id}: ${res.status()} ${await res.text()}`,
          );
        }
        allEntries.push({ id: entry.id, name: drink, matchupId: matchup.id });
      }
    }

    // Step 6 — promote each matchup to its requested phase / winner.
    const resolvedMatchups: CreatedContest['matchups'] = [];
    for (let i = 0; i < seeded.length; i += 1) {
      const seededMatchup = seeded[i];
      const input = matchupInputs[i];
      const isBye = seededMatchup.entries.length === 1;
      let finalPhase: Phase = seededMatchup.phase;

      if (!isBye) {
        const requestedPhase: Phase = input?.phase ?? 'set';
        const winnerEntryId = input?.winnerEntryName
          ? seededMatchup.entries.find(
              (e) => drinkByContestantId.get(e.contestantId) === input.winnerEntryName,
            )?.id
          : undefined;
        const patch: Record<string, unknown> = {};
        if (winnerEntryId) {
          patch.winnerEntryId = winnerEntryId;
          patch.phase = 'scored';
        } else if (requestedPhase !== seededMatchup.phase) {
          patch.phase = requestedPhase;
        }
        if (Object.keys(patch).length > 0) {
          const patchMatchupRes = await api.patch(
            `/api/contest/contests/${contestId}/matchups/${seededMatchup.id}`,
            { data: patch },
          );
          if (!patchMatchupRes.ok()) {
            throw new Error(
              `createContest PATCH /matchups/${seededMatchup.id}: ${patchMatchupRes.status()} ${await patchMatchupRes.text()}`,
            );
          }
          finalPhase = (patch.phase as Phase | undefined) ?? finalPhase;
        }
      }

      resolvedMatchups.push({
        id: seededMatchup.id,
        entryIds: seededMatchup.entries.map((e) => e.id),
        entryNames: seededMatchup.entries.map(
          (e) => drinkByContestantId.get(e.contestantId) ?? '',
        ),
        phase: finalPhase,
        slotIndex: seededMatchup.slotIndex,
        isBye,
      });
    }

    return {
      contestId,
      roundId: firstRoundId,
      roundIds: rounds.map((round) => round.id),
      contestants: Array.from(contestantIdByDrink.entries()).map(([displayName, id]) => ({
        id,
        displayName,
      })),
      entries: allEntries,
      matchups: resolvedMatchups,
    };
  } finally {
    await api.dispose();
  }
}

function collectUniqueDrinkNames(matchups: MatchupInput[]): string[] {
  const seen = new Set<string>();
  for (const matchup of matchups) {
    for (const name of matchup.entryNames) {
      seen.add(name);
    }
  }
  return Array.from(seen);
}
