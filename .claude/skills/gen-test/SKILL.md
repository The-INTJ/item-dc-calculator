---
name: gen-test
description: Generate Vitest + Testing Library tests for a given file or component, following project conventions.
disable-model-invocation: true
---

# Generate Tests

Generate tests for the file specified by the user argument.

## Conventions

Follow these patterns observed in the existing test suite:

- **Imports**: Use explicit named imports from `vitest` (`describe`, `it`, `expect`, `vi`, `beforeEach` as needed). Do not use globals.
- **Structure**: Top-level `describe` block named after the module/hook, with `it` blocks for each case.
- **Mocking**: Declare mock functions as top-level `const mockName = vi.fn()`, then use `vi.mock('module/path', () => ({ ... }))` factory style. Reset mocks in `beforeEach` with `mockReset()`.
- **Hooks**: Test hooks with `renderHook` from `@testing-library/react`.
- **API routes**: Import the route handler directly and call it with a constructed `Request` object. Assert on the response status and JSON body.
- **Assertions**: Prefer `toEqual` for objects, `toBe` for primitives, `toHaveBeenCalledWith` for mock calls.
- **File location**: Place test files co-located with the source file using a `.test.ts` or `.test.tsx` suffix. Use `__tests__/` subdirectory only if the module already follows that pattern.
- **Length**: Test files are exempt from the repo file-length caps (`DEV_STANDARDS.md`), but keep each generated test file focused on one subject — split by subject rather than covering multiple modules in one file.

## Steps

1. Read the target file to understand its exports and dependencies.
2. Identify what needs mocking (external modules, context providers, API calls).
3. Write tests covering the main cases and key edge cases.
4. Run `npx vitest run <test-file>` to verify the tests pass.
