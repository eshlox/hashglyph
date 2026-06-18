import type { Grid } from '../grid.js';

/** Identifier of a supported render style. */
export type StyleId = 'mono-16' | 'color-8';

/**
 * A render palette indexed by cell value. Index 0 is the background (left
 * unpainted so the SVG background shows through); indices 1+ are paint colors.
 */
export type Palette = readonly (string | null)[];

/**
 * A render style: a lossless, reversible mapping between a 32-byte digest and a
 * square grid of palette indices. `size * size * bitsPerCell` always equals 256,
 * so the whole digest is encoded and `decode(encode(d)) === d`.
 *
 * Every style is FROZEN once shipped: changing `size`, `bitsPerCell`, the bit
 * order, or the palette changes generated output.
 */
export interface GlyphStyle {
  readonly id: StyleId;
  /** Human-friendly name for UIs. */
  readonly label: string;
  /** One-line description of the look. */
  readonly description: string;
  /** Grid edge length in cells. */
  readonly size: number;
  /** Bits consumed per cell (1 = monochrome, 4 = 16-color). */
  readonly bitsPerCell: number;
  /** Canonical palette indexed by cell value; `palette[0]` is the background. */
  readonly palette: Palette;
  /** Encode a digest into a grid of palette indices (MSB-first, row-major). */
  encode(digest: Uint8Array): Grid;
  /** Recover the digest from a grid of palette indices. */
  decode(grid: Grid): Uint8Array;
}
