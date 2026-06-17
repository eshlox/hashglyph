import { EmptySeedError } from './errors.js';

/**
 * Unicode default-ignorable code points (zero-width space, BOM, soft hyphen,
 * joiners, etc.). These are invisible, so a "seed" made only of them has no
 * visible content and must normalize away.
 */
const DEFAULT_IGNORABLE = /\p{Default_Ignorable_Code_Point}/gu;

/**
 * Shared normalization recipe (frozen as `MATERIAL_SCHEMA = 'v1'`):
 *   1. Unicode NFKC normalization (so visually identical inputs converge).
 *   2. Strip default-ignorable (invisible) code points.
 *   3. Trim surrounding whitespace.
 *   4. Lowercase.
 */
function applyRecipe(seed: string): string {
  return seed.normalize('NFKC').replace(DEFAULT_IGNORABLE, '').trim().toLowerCase();
}

/**
 * Normalize a seed into its canonical brand form.
 *
 * `HashGlyph`, ` hashglyph `, and `HASHGLYPH` therefore all resolve to
 * `hashglyph`; a seed of only whitespace or invisible characters is empty.
 *
 * @throws {EmptySeedError} if nothing visible remains after normalization.
 */
export function normalizeSeed(seed: string): string {
  const normalized = applyRecipe(seed);
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
  const normalized = applyRecipe(seed);
  return normalized.length === 0 ? null : normalized;
}
