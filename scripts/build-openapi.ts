/**
 * Regenerates `app/api/contest/openapi.json` from the zod schemas registered
 * in `src/features/contest/lib/schemas/index.ts`.
 *
 * Strategy: the path operations are still hand-written at the moment
 * (migrating every path into the registry is a separate chunk of work). This
 * script only overwrites the `components.schemas` block so the TS types and
 * the OpenAPI types cannot drift.
 *
 * Run with: `npx tsx scripts/build-openapi.ts` (also wired as `npm run docs:build`).
 */

import { writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { registry } from '../src/features/contest/lib/schemas';

const SPEC_PATH = resolve(process.cwd(), 'app/api/contest/openapi.json');

function main() {
  const generator = new OpenApiGeneratorV31(registry.definitions);
  const generated = generator.generateComponents();
  const generatedSchemas = generated.components?.schemas ?? {};

  const existing = JSON.parse(readFileSync(SPEC_PATH, 'utf-8'));

  existing.components ??= {};
  existing.components.schemas = generatedSchemas;

  writeFileSync(SPEC_PATH, `${JSON.stringify(existing, null, 2)}\n`);

  const count = Object.keys(generatedSchemas).length;
  console.log(`[build-openapi] Wrote ${count} schemas to ${SPEC_PATH}`);
}

main();
