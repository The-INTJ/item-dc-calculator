/**
 * Test runner for User Story API tests.
 *
 * Executes test specs defined in JSON format, handling setup,
 * main actions, validation, and teardown phases.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { TestSpec, TestAction } from './types';
import { ApiTestClient, validateResponse, parseTestSpec } from './helpers';

/**
 * Options for running a story test.
 */
export interface RunOptions {
  /** Override the base URL from the spec */
  baseUrl?: string;
  /** Additional variables to inject */
  variables?: Record<string, unknown>;
  /** Timeout for individual actions in ms */
  actionTimeout?: number;
}

/**
 * Runs a complete User Story test from a JSON spec.
 */
export function runStoryTest(specJson: unknown, options: RunOptions = {}): void {
  const spec = parseTestSpec(specJson);
  const baseUrl = options.baseUrl ?? spec.baseUrl;

  describe(spec.story, () => {
    const client = new ApiTestClient(baseUrl);

    // Initialize variables
    if (spec.variables) {
      client.initVariables(spec.variables);
    }
    if (options.variables) {
      client.initVariables(options.variables);
    }

    /**
     * Executes a list of actions sequentially.
     */
    async function executeActions(
      actions: TestAction[],
      phase: string
    ): Promise<void> {
      for (const action of actions) {
        // Skip if condition is met
        if (action.skipIf) {
          const skipValue = client.interpolate(`{{${action.skipIf}}}`);
          if (skipValue === 'true') {
            console.log(`[${phase}] Skipping action "${action.id}" due to skipIf condition`);
            continue;
          }
        }

        try {
          const response = await client.execute(action);

          // Validate response if output is specified
          if (action.output) {
            const validation = validateResponse(action, response);
            if (!validation.passed) {
              const errorMsg = `[${phase}] Action "${action.id}" failed:\n${validation.errors.join('\n')}`;
              if (action.continueOnError) {
                console.warn(errorMsg);
              } else {
                throw new Error(errorMsg);
              }
            }
          }
        } catch (error) {
          if (action.continueOnError) {
            console.warn(`[${phase}] Action "${action.id}" threw error (continuing):`, error);
          } else {
            throw error;
          }
        }
      }
    }

    // Setup phase
    beforeAll(async () => {
      if (spec.setup?.actions && spec.setup.actions.length > 0) {
        await executeActions(spec.setup.actions, 'setup');
      }
    });

    // Teardown phase
    afterAll(async () => {
      if (spec.teardown?.actions && spec.teardown.actions.length > 0) {
        try {
          await executeActions(spec.teardown.actions, 'teardown');
        } catch (error) {
          // Log but don't fail on teardown errors
          console.warn('[teardown] Error during cleanup:', error);
        }
      }
    });

    // Main test
    it(spec.description, async () => {
      // Execute main actions
      for (const action of spec.actions) {
        // Skip if condition is met
        if (action.skipIf) {
          const skipValue = client.interpolate(`{{${action.skipIf}}}`);
          if (skipValue === 'true') {
            console.log(`Skipping action "${action.id}" due to skipIf condition`);
            continue;
          }
        }

        const response = await client.execute(action);

        // Validate response if output is specified
        if (action.output) {
          const validation = validateResponse(action, response);
          expect(
            validation.passed,
            `Action "${action.id}" failed:\n${validation.errors.join('\n')}\n\nResponse body: ${JSON.stringify(response.body, null, 2)}`
          ).toBe(true);
        }
      }

      // Execute validation checks
      if (spec.validate?.checks && spec.validate.checks.length > 0) {
        for (const check of spec.validate.checks) {
          const response = await client.execute(check);

          if (check.output) {
            const validation = validateResponse(check, response);
            expect(
              validation.passed,
              `Validation "${check.id}" failed:\n${validation.errors.join('\n')}\n\nResponse body: ${JSON.stringify(response.body, null, 2)}`
            ).toBe(true);
          }
        }
      }
    });
  });
}

/**
 * Creates a test suite from multiple specs.
 */
export function runStoryTests(
  specs: unknown[],
  options: RunOptions = {}
): void {
  for (const spec of specs) {
    runStoryTest(spec, options);
  }
}
