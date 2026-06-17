/**
 * Global stability constants for HashGlyph.
 *
 * These describe the *contract*, not the npm package version. Changing any of
 * them changes generated output and therefore MUST be accompanied by a new
 * versioned grammar id (e.g. `-v2`). The canonical `eshlox` mark is frozen
 * against `MATERIAL_SCHEMA = 'v1'` forever.
 */

/** Version of the seed → material recipe (`normalize` + the `id|seed` template). */
export const MATERIAL_SCHEMA = 'v1' as const;

/** Edge length of the pixel grid. The whole visual grammar assumes 9×9. */
export const GRID_SIZE = 9 as const;

/**
 * Number of digest bytes surfaced in metadata (`digestHex`) and fed to the
 * {@link BitStream}. 64 bytes = 512 bits, comfortably more than any grammar's
 * bit budget, and — for BLAKE3 — exactly the canonical 64-byte digest.
 */
export const DIGEST_DISPLAY_BYTES = 64 as const;
