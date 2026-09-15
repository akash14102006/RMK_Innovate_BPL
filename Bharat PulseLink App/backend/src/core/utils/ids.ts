/**
 * ID Generation
 *
 * Centralized, non-enumerable, time-ordered ID strategy using UUIDv7.
 * UUIDv7 is time-ordered (safe for DB indexing), globally unique, non-predictable.
 *
 * Rules:
 * - Internal DB PKs: UUID v7
 * - Never expose sequential numeric IDs as public-facing identifiers
 * - Never use phone/email as application IDs
 *
 * Owned by: Platform Foundation (Prompt 87)
 */

import { uuidv7 } from 'uuidv7';

/**
 * Generates a new UUIDv7 identifier.
 * Time-ordered, globally unique, database-index-friendly.
 */
export function generateId(): string {
  return uuidv7();
}

/**
 * Validates that a string is a structurally valid UUID (v4, v7, etc.).
 */
export function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
