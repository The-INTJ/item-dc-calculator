/**
 * Validation utilities for contest configuration and scores.
 *
 * Provides runtime validation for:
 * - ContestConfig objects (from JSON input)
 * - ScoreBreakdown objects (against a config's attributes)
 */

import type { ContestConfig, AttributeConfig, ScoreBreakdown } from './types';

// ============================================================================
// Validation Result Types
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function success(): ValidationResult {
  return { valid: true, errors: [] };
}

function failure(errors: string[]): ValidationResult {
  return { valid: false, errors };
}

// ============================================================================
// ContestConfig Validation
// ============================================================================

/**
 * Validate a ContestConfig object.
 * Use this when parsing JSON input from admins.
 */
export function validateContestConfig(config: unknown): ValidationResult {
  const errors: string[] = [];

  if (!config || typeof config !== 'object') {
    return failure(['Config must be an object']);
  }

  const c = config as Record<string, unknown>;

  // Validate topic
  if (typeof c.topic !== 'string' || c.topic.trim().length === 0) {
    errors.push('topic is required and must be a non-empty string');
  }

  // Validate attributes
  if (!Array.isArray(c.attributes)) {
    errors.push('attributes must be an array');
  } else if (c.attributes.length === 0) {
    errors.push('attributes must have at least one item');
  } else {
    const ids = new Set<string>();
    c.attributes.forEach((attr, i) => {
      const attrErrors = validateAttributeConfig(attr, i);
      errors.push(...attrErrors);

      // Check for duplicate IDs
      if (typeof attr === 'object' && attr !== null && 'id' in attr) {
        const id = (attr as { id: unknown }).id;
        if (typeof id === 'string') {
          if (ids.has(id)) {
            errors.push(`attributes[${i}]: duplicate id "${id}"`);
          }
          ids.add(id);
        }
      }
    });
  }

  // Validate optional labels
  if (c.entryLabel !== undefined && typeof c.entryLabel !== 'string') {
    errors.push('entryLabel must be a string if provided');
  }
  if (c.entryLabelPlural !== undefined && typeof c.entryLabelPlural !== 'string') {
    errors.push('entryLabelPlural must be a string if provided');
  }

  return errors.length === 0 ? success() : failure(errors);
}

/**
 * Validate a single AttributeConfig.
 */
function validateAttributeConfig(attr: unknown, index: number): string[] {
  const prefix = `attributes[${index}]`;
  const errors: string[] = [];

  if (!attr || typeof attr !== 'object') {
    return [`${prefix}: must be an object`];
  }

  const a = attr as Record<string, unknown>;

  // Validate id (required)
  if (typeof a.id !== 'string' || a.id.trim().length === 0) {
    errors.push(`${prefix}.id: required non-empty string`);
  } else if (!/^[a-z][a-z0-9_]*$/.test(a.id)) {
    errors.push(`${prefix}.id: must be lowercase alphanumeric with underscores, starting with a letter`);
  }

  // Validate label (required)
  if (typeof a.label !== 'string' || a.label.trim().length === 0) {
    errors.push(`${prefix}.label: required non-empty string`);
  }

  // Validate description (optional)
  if (a.description !== undefined && typeof a.description !== 'string') {
    errors.push(`${prefix}.description: must be a string if provided`);
  }

  // Validate weight (optional)
  if (a.weight !== undefined) {
    if (typeof a.weight !== 'number' || a.weight <= 0) {
      errors.push(`${prefix}.weight: must be a positive number if provided`);
    }
  }

  // Validate min (optional)
  if (a.min !== undefined && typeof a.min !== 'number') {
    errors.push(`${prefix}.min: must be a number if provided`);
  }

  // Validate max (optional)
  if (a.max !== undefined && typeof a.max !== 'number') {
    errors.push(`${prefix}.max: must be a number if provided`);
  }

  // Validate min < max
  if (typeof a.min === 'number' && typeof a.max === 'number' && a.min >= a.max) {
    errors.push(`${prefix}: min must be less than max`);
  }

  return errors;
}

// ============================================================================
// ScoreBreakdown Validation
// ============================================================================

/**
 * Validate a ScoreBreakdown against a ContestConfig.
 * Ensures all required attributes are present and within valid ranges.
 */
export function validateScoreBreakdown(
  breakdown: unknown,
  config: ContestConfig
): ValidationResult {
  const errors: string[] = [];

  if (!breakdown || typeof breakdown !== 'object') {
    return failure(['breakdown must be an object']);
  }

  const b = breakdown as Record<string, unknown>;
  const validIds = new Set(config.attributes.map((a) => a.id));

  // Check all required attributes are present and valid
  for (const attr of config.attributes) {
    if (!(attr.id in b)) {
      errors.push(`missing required attribute: ${attr.id}`);
    } else {
      const value = b[attr.id];
      if (typeof value !== 'number') {
        errors.push(`${attr.id}: must be a number`);
      } else if (!Number.isFinite(value)) {
        errors.push(`${attr.id}: must be a finite number`);
      } else {
        const min = attr.min ?? 0;
        const max = attr.max ?? 10;
        if (value < min || value > max) {
          errors.push(`${attr.id}: must be between ${min} and ${max}`);
        }
      }
    }
  }

  // Check for extra/unknown attributes
  for (const key of Object.keys(b)) {
    if (!validIds.has(key)) {
      errors.push(`unknown attribute: ${key}`);
    }
  }

  return errors.length === 0 ? success() : failure(errors);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create an empty ScoreBreakdown with all attributes set to 0.
 */
export function createEmptyBreakdown(config: ContestConfig): ScoreBreakdown {
  const breakdown: ScoreBreakdown = {};
  for (const attr of config.attributes) {
    breakdown[attr.id] = 0;
  }
  return breakdown;
}

/**
 * Get the minimum value for an attribute (default: 0).
 */
export function getAttributeMin(attr: AttributeConfig): number {
  return attr.min ?? 0;
}

/**
 * Get the maximum value for an attribute (default: 10).
 */
export function getAttributeMax(attr: AttributeConfig): number {
  return attr.max ?? 10;
}

/**
 * Get the weight for an attribute (default: 1).
 */
export function getAttributeWeight(attr: AttributeConfig): number {
  return attr.weight ?? 1;
}

/**
 * Check if a breakdown key is valid for a config.
 */
export function isValidAttributeId(id: string, config: ContestConfig): boolean {
  return config.attributes.some((attr) => attr.id === id);
}

/**
 * Get attribute IDs from a config as an array.
 */
export function getAttributeIds(config: ContestConfig): string[] {
  return config.attributes.map((attr) => attr.id);
}

/**
 * Normalize a breakdown to ensure all attributes exist (fill missing with 0).
 */
export function normalizeBreakdown(
  breakdown: ScoreBreakdown,
  config: ContestConfig
): ScoreBreakdown {
  const normalized: ScoreBreakdown = {};
  for (const attr of config.attributes) {
    normalized[attr.id] = breakdown[attr.id] ?? 0;
  }
  return normalized;
}

/**
 * Calculate weighted total score from a breakdown.
 */
export function calculateWeightedTotal(
  breakdown: ScoreBreakdown,
  config: ContestConfig
): number {
  let total = 0;
  let weightSum = 0;

  for (const attr of config.attributes) {
    const value = breakdown[attr.id] ?? 0;
    const weight = getAttributeWeight(attr);
    total += value * weight;
    weightSum += weight;
  }

  // Return weighted average if weights are used
  return weightSum > 0 ? total / weightSum : 0;
}
