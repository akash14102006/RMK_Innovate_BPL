/**
 * Result Type — Explicit Error Handling
 *
 * A lightweight Result<T, E> monad for domain operations.
 * Avoids thrown exceptions for expected domain failures.
 * Thrown exceptions remain for unexpected/infrastructure failures.
 *
 * Owned by: Platform Foundation (Prompt 87)
 */

export type Result<T, E = Error> =
  | { readonly success: true; readonly value: T }
  | { readonly success: false; readonly error: E };

export function ok<T>(value: T): Result<T, never> {
  return { success: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { success: false, error };
}

export function isOk<T, E>(result: Result<T, E>): result is { success: true; value: T } {
  return result.success === true;
}

export function isErr<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return result.success === false;
}

/**
 * Maps the value of a successful Result.
 */
export function mapResult<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  if (result.success) {
    return ok(fn(result.value));
  }
  return result;
}

/**
 * Unwraps value or throws the contained error.
 */
export function unwrap<T, E extends Error>(result: Result<T, E>): T {
  if (result.success) return result.value;
  throw result.error;
}
