import { bytesToHex } from '@noble/hashes/utils.js';
import type { Grid } from './grid.js';
import type { HashId } from './hash/registry.js';
import { DEFAULT_HASH, getHash } from './hash/registry.js';
import { normalizeSeed } from './normalize.js';
import { DEFAULT_STYLE, getStyle } from './style/registry.js';
import type { Palette, StyleId } from './style/types.js';
import { DIGEST_BYTES, MATERIAL_PREFIX } from './version.js';

/** Options for {@link generateGlyph}. */
export interface GenerateOptions {
  /** The raw seed (e.g. a nickname). Normalized internally. */
  readonly seed: string;
  /** Hash function id. Defaults to `blake3`. */
  readonly hash?: HashId;
  /** Render style id. Defaults to `mono-16`. */
  readonly style?: StyleId;
}

/** A fully resolved, deterministic glyph and its provenance metadata. */
export interface Glyph {
  /** The raw seed as supplied. */
  readonly seed: string;
  /** The normalized seed actually hashed. */
  readonly normalized: string;
  readonly hashId: HashId;
  readonly styleId: StyleId;
  /** The exact string fed to the hash: `${MATERIAL_PREFIX}|${normalized}`. */
  readonly material: string;
  /** The full {@link DIGEST_BYTES}-byte identity digest. */
  readonly digest: Uint8Array;
  /** Hex of the full digest: the canonical, hash-specific id for this seed. */
  readonly digestHex: string;
  /** Grid of palette indices, `grid[y][x]` (index 0 = background). */
  readonly grid: Grid;
  /** Palette indexed by cell value, supplied by the style. */
  readonly palette: Palette;
}

/**
 * Generate a deterministic glyph from a seed.
 *
 * Pipeline: normalize → build material `${MATERIAL_PREFIX}|${seed}` → hash to a
 * 32-byte digest → encode the whole digest into the style's grid.
 *
 * The digest depends only on `(hash, seed)`, so both styles render the *same*
 * digest two different ways. Under any strong hash, two distinct seeds sharing a
 * glyph is computationally infeasible.
 *
 * @throws {EmptySeedError} when the seed normalizes to empty.
 * @throws {UnknownAlgorithmError} for an unknown hash or style id.
 */
export function generateGlyph(options: GenerateOptions): Glyph {
  const hashId = options.hash ?? DEFAULT_HASH;
  const styleId = options.style ?? DEFAULT_STYLE;
  const hash = getHash(hashId);
  const style = getStyle(styleId);

  const normalized = normalizeSeed(options.seed);
  const material = `${MATERIAL_PREFIX}|${normalized}`;
  const digest = hash.expand(material, DIGEST_BYTES);
  const grid = style.encode(digest);

  return {
    seed: options.seed,
    normalized,
    hashId,
    styleId,
    material,
    digest,
    digestHex: bytesToHex(digest),
    grid,
    palette: style.palette,
  };
}
