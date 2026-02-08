/**
 * Helper utilities for User Story API tests.
 */

import type {
  TestAction,
  TestSpec,
  OutputValidation,
  ValidationResult,
  ApiResponse,
} from './types';

/**
 * Gets a nested value from an object using a dot-notation path.
 * Supports array index notation like "entries[0].name".
 */
export function getValueByPath(obj: unknown, path: string): unknown {
  if (!path || path === '') {
    return obj;
  }

  // Convert array notation to dot notation: entries[0] -> entries.0
  const normalizedPath = path.replace(/\[(\d+)\]/g, '.$1');
  const parts = normalizedPath.split('.');

  let value: unknown = obj;
  for (const part of parts) {
    if (value === null || value === undefined) {
      return undefined;
    }
    if (typeof value === 'object') {
      value = (value as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return value;
}

/**
 * Deep equality check for comparing values.
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return a === b;
  if (typeof a !== typeof b) return false;

  if (typeof a === 'object') {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;

    if (Array.isArray(a) !== Array.isArray(b)) return false;

    const aKeys = Object.keys(aObj);
    const bKeys = Object.keys(bObj);

    if (aKeys.length !== bKeys.length) return false;

    for (const key of aKeys) {
      if (!deepEqual(aObj[key], bObj[key])) return false;
    }
    return true;
  }

  return false;
}

/**
 * API test client for executing test actions.
 */
export class ApiTestClient {
  private baseUrl: string;
  private variables: Record<string, unknown> = {};

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Initializes pre-defined variables.
   */
  initVariables(vars: Record<string, unknown>): void {
    this.variables = { ...this.variables, ...vars };
  }

  /**
   * Stores a value under a key for later interpolation.
   */
  store(key: string, value: unknown): void {
    this.variables[key] = value;
  }

  /**
   * Gets a stored variable value.
   */
  get(key: string): unknown {
    return this.variables[key];
  }

  /**
   * Replaces {{variable.path}} patterns in text with actual values.
   */
  interpolate(text: string): string {
    return text.replace(/\{\{([^}]+)\}\}/g, (_, path: string) => {
      const trimmedPath = path.trim();
      const value = getValueByPath(this.variables, trimmedPath);
      if (value === undefined || value === null) {
        console.warn(`[ApiTestClient] Variable not found: ${trimmedPath}`);
        return '';
      }
      return String(value);
    });
  }

  /**
   * Recursively interpolates variables in an object.
   */
  interpolateObject<T>(obj: T): T {
    if (typeof obj === 'string') {
      return this.interpolate(obj) as T;
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => this.interpolateObject(item)) as T;
    }
    if (obj !== null && typeof obj === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.interpolateObject(value);
      }
      return result as T;
    }
    return obj;
  }

  /**
   * Builds query string from params object.
   */
  private buildQueryString(params: Record<string, string>): string {
    const interpolated = this.interpolateObject(params);
    const entries = Object.entries(interpolated).filter(
      ([, v]) => v !== undefined && v !== null && v !== ''
    );
    if (entries.length === 0) return '';
    return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
  }

  /**
   * Executes a single test action and returns the response.
   */
  async execute(action: TestAction): Promise<ApiResponse> {
    // Handle delay
    if (action.delay && action.delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, action.delay));
    }

    // Build URL with interpolation
    const endpoint = this.interpolate(action.endpoint);
    const queryString = action.queryParams ? this.buildQueryString(action.queryParams) : '';
    const url = `${this.baseUrl}${endpoint}${queryString}`;

    // Build headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(action.headers ? this.interpolateObject(action.headers) : {}),
    };

    // Build request options
    const options: RequestInit = {
      method: action.method,
      headers,
    };

    // Add body for POST/PATCH
    if (action.input && ['POST', 'PATCH'].includes(action.method)) {
      const interpolatedInput = this.interpolateObject(action.input);
      options.body = JSON.stringify(interpolatedInput);
    }

    // Execute request
    const response = await fetch(url, options);

    // Parse body
    let body: unknown = null;
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      try {
        body = await response.json();
      } catch {
        body = null;
      }
    }

    // Store response if requested
    if (action.storeAs && body) {
      this.store(action.storeAs, body);
    }

    return {
      status: response.status,
      body,
      headers: response.headers,
    };
  }
}

/**
 * Validates a response against expected output rules.
 */
export function validateResponse(
  action: TestAction,
  response: ApiResponse
): ValidationResult {
  const errors: string[] = [];
  const output = action.output;

  if (!output) {
    return { passed: true, errors: [] };
  }

  // Validate status code
  if (output.status !== undefined && response.status !== output.status) {
    errors.push(
      `[${action.id}] Expected status ${output.status}, got ${response.status}`
    );
  }

  // Validate exact body fields
  if (output.body) {
    for (const [key, expected] of Object.entries(output.body)) {
      const actual = getValueByPath(response.body, key);
      if (!deepEqual(actual, expected)) {
        errors.push(
          `[${action.id}] Expected body.${key} = ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
        );
      }
    }
  }

  // Validate bodyContains (JSONPath partial match)
  if (output.bodyContains) {
    const { path, value } = output.bodyContains;
    const actual = getValueByPath(response.body, path);
    if (!deepEqual(actual, value)) {
      errors.push(
        `[${action.id}] Expected path "${path}" to contain ${JSON.stringify(value)}, got ${JSON.stringify(actual)}`
      );
    }
  }

  // Validate bodyNotContains
  if (output.bodyNotContains) {
    const { path, value } = output.bodyNotContains;
    const actual = getValueByPath(response.body, path);
    if (deepEqual(actual, value)) {
      errors.push(
        `[${action.id}] Expected path "${path}" NOT to contain ${JSON.stringify(value)}`
      );
    }
  }

  // Validate bodyMatches (regex)
  if (output.bodyMatches) {
    const { path, pattern } = output.bodyMatches;
    const actual = getValueByPath(response.body, path);
    if (typeof actual !== 'string') {
      errors.push(
        `[${action.id}] Expected path "${path}" to be a string for regex match, got ${typeof actual}`
      );
    } else {
      const regex = new RegExp(pattern);
      if (!regex.test(actual)) {
        errors.push(
          `[${action.id}] Expected path "${path}" to match pattern "${pattern}", got "${actual}"`
        );
      }
    }
  }

  // Validate bodyLength
  if (output.bodyLength) {
    const { path, min, max, exact } = output.bodyLength;
    const actual = getValueByPath(response.body, path);
    if (!Array.isArray(actual)) {
      errors.push(
        `[${action.id}] Expected path "${path}" to be an array, got ${typeof actual}`
      );
    } else {
      const length = actual.length;
      if (exact !== undefined && length !== exact) {
        errors.push(
          `[${action.id}] Expected array at "${path}" to have exactly ${exact} items, got ${length}`
        );
      }
      if (min !== undefined && length < min) {
        errors.push(
          `[${action.id}] Expected array at "${path}" to have at least ${min} items, got ${length}`
        );
      }
      if (max !== undefined && length > max) {
        errors.push(
          `[${action.id}] Expected array at "${path}" to have at most ${max} items, got ${length}`
        );
      }
    }
  }

  // Validate headers
  if (output.headers) {
    for (const [key, expected] of Object.entries(output.headers)) {
      const actual = response.headers.get(key.toLowerCase());
      if (actual !== expected) {
        errors.push(
          `[${action.id}] Expected header "${key}" = "${expected}", got "${actual}"`
        );
      }
    }
  }

  return {
    passed: errors.length === 0,
    errors,
  };
}

/**
 * Loads and parses a test spec from a JSON file.
 */
export function parseTestSpec(json: unknown): TestSpec {
  const spec = json as TestSpec;

  // Basic validation
  if (!spec.story || typeof spec.story !== 'string') {
    throw new Error('TestSpec must have a "story" field');
  }
  if (!spec.description || typeof spec.description !== 'string') {
    throw new Error('TestSpec must have a "description" field');
  }
  if (!spec.baseUrl || typeof spec.baseUrl !== 'string') {
    throw new Error('TestSpec must have a "baseUrl" field');
  }
  if (!Array.isArray(spec.actions) || spec.actions.length === 0) {
    throw new Error('TestSpec must have at least one action');
  }

  return spec;
}
