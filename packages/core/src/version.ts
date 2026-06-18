/**
 * Global stability constants for HashGlyph.
 *
 * These describe the *contract*, not the npm package version. Changing any of
 * them changes generated output and therefore breaks every existing glyph.
 */

/** Version of the seed → material recipe (`normalize` + the `prefix|seed` template). */
export const MATERIAL_SCHEMA = 'v2' as const;

/**
 * Domain-separation prefix prepended to every normalized seed before hashing.
 * The hash material is `${MATERIAL_PREFIX}|${normalized}`. The hash and style
 * are intentionally excluded: a fixed (hash, seed) pair yields one canonical
 * digest, which the styles merely render differently.
 */
export const MATERIAL_PREFIX = `hashglyph-${MATERIAL_SCHEMA}` as const;

/**
 * Width of the canonical identity digest, in bytes. 32 bytes = 256 bits: for any
 * strong hash, finding two seeds that share a digest (and therefore a glyph) is
 * computationally infeasible (~2^128 work). It is also exactly the capacity every
 * render style encodes, so a glyph is a lossless picture of its digest.
 */
export const DIGEST_BYTES = 32 as const;
