import { EmptySeedError } from './errors.js';

/**
 * Normalize a seed into its canonical brand form.
 *
 * Recipe (frozen as `MATERIAL_SCHEMA = 'v1'`):
 *   1. Unicode NFKC normalization (so visually identical inputs converge).
 *   2. Trim surrounding whitespace.
 *   3. Lowercase.
 *
 * `HashGlyph`, ` hashglyph `, and `HASHGLYPH` therefore all resolve to `hashglyph`.
 *
 * @throws {EmptySeedError} if nothing visible remains after normalization.
 */
export function normalizeSeed(seed: string): string {
  const normalized = seed.normalize('NFKC').trim().toLowerCase();
  if (normalized.length === 0) {
    throw new EmptySeedError();
  }
  return normalized;
}

/**
 * Like {@link normalizeSeed} but returns `null` instead of throwing on empty
 * input. Convenient for UI code that validates as the user types.
 */
export function tryNormalizeSeed(seed: string): string | null {
  const normalized = seed.normalize('NFKC').trim().toLowerCase();
  return normalized.length === 0 ? null : normalized;
}
