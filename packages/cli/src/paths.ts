import { isAbsolute, resolve, sep } from 'node:path';

/**
 * Convert an arbitrary seed into a filesystem-safe slug. Never used as a path
 * on its own — always combined with a directory you control and re-checked by
 * {@link resolveInside}. Strips anything outside `[a-z0-9-]`, collapses runs of
 * separators, trims, and caps length. Falls back to `glyph` if nothing remains.
 */
export function slugify(seed: string): string {
  const slug = seed
    .normalize('NFKD')
    .replace(/\p{Mn}/gu, '') // strip combining diacritical marks
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
    .replace(/-+$/g, '');
  return slug.length > 0 ? slug : 'glyph';
}

/** Error thrown when a resolved path would escape its base directory. */
export class PathEscapeError extends Error {
  override readonly name = 'PathEscapeError';
  constructor(baseDir: string, target: string) {
    super(`Refusing to write outside the output directory.\n  base: ${baseDir}\n  path: ${target}`);
  }
}

/**
 * Resolve `relativeName` inside `baseDir` and guarantee the result stays within
 * `baseDir`. Rejects absolute paths and any `..` traversal. This is the single
 * choke point that makes writing files derived from untrusted seeds safe.
 *
 * @throws {PathEscapeError} if the resolved path escapes `baseDir`.
 */
export function resolveInside(baseDir: string, relativeName: string): string {
  if (isAbsolute(relativeName)) {
    throw new PathEscapeError(baseDir, relativeName);
  }
  const base = resolve(baseDir);
  const target = resolve(base, relativeName);
  if (target !== base && !target.startsWith(base + sep)) {
    throw new PathEscapeError(base, target);
  }
  return target;
}
