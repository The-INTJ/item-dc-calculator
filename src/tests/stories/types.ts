/**
 * Type definitions for User Story API tests.
 */

/**
 * HTTP methods supported by test actions.
 */
export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

/**
 * Output validation for array length checks.
 */
export interface BodyLengthValidation {
  path: string;
  min?: number;
  max?: number;
  exact?: number;
}

/**
 * Output validation rules for a test action.
 */
export interface OutputValidation {
  /** Expected HTTP status code */
  status?: number;
  /** Exact match for response body fields (top-level) */
  body?: Record<string, unknown>;
  /** Partial match using JSONPath */
  bodyContains?: { path: string; value: unknown };
  /** Ensure value is NOT present */
  bodyNotContains?: { path: string; value: unknown };
  /** Regex pattern matching for string values */
  bodyMatches?: { path: string; pattern: string };
  /** Array length validation */
  bodyLength?: BodyLengthValidation;
  /** Expected response headers */
  headers?: Record<string, string>;
}

/**
 * A single test action (API call).
 */
export interface TestAction {
  /** Unique identifier for this action */
  id: string;
  /** Human-readable description */
  description?: string;
  /** HTTP method */
  method: HttpMethod;
  /** API endpoint (supports {{variable}} interpolation) */
  endpoint: string;
  /** Request body for POST/PATCH */
  input?: Record<string, unknown>;
  /** Additional request headers */
  headers?: Record<string, string>;
  /** URL query parameters */
  queryParams?: Record<string, string>;
  /** Response validation rules */
  output?: OutputValidation;
  /** Store response body as variable */
  storeAs?: string;
  /** Delay in milliseconds before executing */
  delay?: number;
  /** Skip if expression evaluates to true */
  skipIf?: string;
  /** Continue test even if this action fails */
  continueOnError?: boolean;
}

/**
 * Setup/teardown phase definition.
 */
export interface TestPhase {
  description?: string;
  actions: TestAction[];
}

/**
 * Validation phase definition.
 */
export interface ValidationPhase {
  description?: string;
  checks: TestAction[];
}

/**
 * Complete test specification for a User Story.
 */
export interface TestSpec {
  /** The user story being tested */
  story: string;
  /** Brief description of what this test validates */
  description: string;
  /** Base URL for API calls */
  baseUrl: string;
  /** Pre-defined variables */
  variables?: Record<string, unknown>;
  /** Pre-test setup actions */
  setup?: TestPhase;
  /** Main test actions */
  actions: TestAction[];
  /** End-state validation checks */
  validate?: ValidationPhase;
  /** Cleanup actions after test */
  teardown?: TestPhase;
}

/**
 * Result of validating a response against expected output.
 */
export interface ValidationResult {
  passed: boolean;
  errors: string[];
}

/**
 * Response from an API call.
 */
export interface ApiResponse {
  status: number;
  body: unknown;
  headers: Headers;
}
