import { bytesToHex } from '@noble/hashes/utils.js';
import type { Grid } from './grid.js';
import { getHash, type HashId } from './hash/registry.js';
import { normalizeSeed } from './normalize.js';
import { getStyle } from './style/registry.js';
import type { StyleId } from './style/types.js';
import { DIGEST_BYTES, MATERIAL_PREFIX } from './version.js';

/** Recover the identity digest encoded in a glyph grid. */
export function decodeGlyph(grid: Grid, style: StyleId): Uint8Array {
  return getStyle(style).decode(grid);
}

/** Hex of the identity digest encoded in a glyph grid. */
export function decodeGlyphHex(grid: Grid, style: StyleId): string {
  return bytesToHex(decodeGlyph(grid, style));
}

/** The digest a `(seed, hash)` pair produces. The string itself is unrecoverable. */
export function digestFor(seed: string, hash: HashId): Uint8Array {
  const material = `${MATERIAL_PREFIX}|${normalizeSeed(seed)}`;
  return getHash(hash).expand(material, DIGEST_BYTES);
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}

/**
 * Prove that `grid` is exactly the glyph `(seed, hash)` produces under `style`.
 *
 * This re-derives the digest from the seed and compares it to the one read back
 * out of the grid. It cannot reveal the seed (the hash is one-way); it only
 * confirms a seed you already have.
 */
export function verifyGlyph(grid: Grid, style: StyleId, seed: string, hash: HashId): boolean {
  const resolved = getStyle(style);
  if (grid.length !== resolved.size) return false;
  return bytesEqual(resolved.decode(grid), digestFor(seed, hash));
}

export { DIGEST_BYTES };
