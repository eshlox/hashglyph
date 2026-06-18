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

/** Strict, structural grid equality: same dimensions and identical cell values. */
function gridsEqual(a: Grid, b: Grid): boolean {
  if (a.length !== b.length) return false;
  for (let y = 0; y < b.length; y += 1) {
    const rowA = a[y];
    const rowB = b[y];
    if (!rowA || !rowB || rowA.length !== rowB.length) return false;
    for (let x = 0; x < rowB.length; x += 1) {
      if (rowA[x] !== rowB[x]) return false;
    }
  }
  return true;
}

/**
 * Prove that `grid` is exactly the glyph `(seed, hash)` produces under `style`.
 *
 * The grid must match the canonical encoding cell-for-cell: right dimensions,
 * right palette indices, no extra rows/columns or out-of-range values. (This is
 * stricter than digest-equivalence, which would accept padded rows or cell
 * values that share the same low bits.) It cannot reveal the seed (the hash is
 * one-way); it only confirms a seed you already have.
 */
export function verifyGlyph(grid: Grid, style: StyleId, seed: string, hash: HashId): boolean {
  const resolved = getStyle(style);
  return gridsEqual(grid, resolved.encode(digestFor(seed, hash)));
}

export { DIGEST_BYTES };
