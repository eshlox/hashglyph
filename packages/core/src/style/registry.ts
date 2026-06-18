import { BitStream } from '../bitstream.js';
import { UnknownAlgorithmError } from '../errors.js';
import { emptyGrid, type Grid, setCell } from '../grid.js';
import { DIGEST_BYTES } from '../version.js';
import { COLOR_PALETTE, MONO_PALETTE } from './palette.js';
import type { GlyphStyle, Palette, StyleId } from './types.js';

/**
 * Build a style whose grid losslessly encodes the whole digest: each of the
 * `size * size` cells holds `bitsPerCell` bits, read MSB-first and row-major.
 * `size * size * bitsPerCell` must equal the digest width in bits.
 */
function makeStyle(
  id: StyleId,
  label: string,
  description: string,
  size: number,
  bitsPerCell: number,
  palette: Palette,
): GlyphStyle {
  const capacity = size * size * bitsPerCell;
  if (capacity !== DIGEST_BYTES * 8) {
    throw new RangeError(
      `Style "${id}" encodes ${capacity} bits but the digest is ${DIGEST_BYTES * 8}.`,
    );
  }

  const encode = (digest: Uint8Array): Grid => {
    const bits = new BitStream(digest);
    const grid = emptyGrid(size);
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        setCell(grid, x, y, bits.bits(bitsPerCell));
      }
    }
    return grid;
  };

  const decode = (grid: Grid): Uint8Array => {
    const out = new Uint8Array(DIGEST_BYTES);
    let bit = 0;
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const value = grid[y]?.[x] ?? 0;
        for (let b = bitsPerCell - 1; b >= 0; b -= 1) {
          const index = bit >> 3;
          if ((value >> b) & 1) out[index] = (out[index] ?? 0) | (0x80 >> (bit & 7));
          bit += 1;
        }
      }
    }
    return out;
  };

  return { id, label, description, size, bitsPerCell, palette, encode, decode };
}

const PROVIDERS: Record<StyleId, GlyphStyle> = {
  'mono-16': makeStyle(
    'mono-16',
    'Mono 16×16',
    'Monochrome 16×16 grid: every one of the 256 digest bits is one pixel.',
    16,
    1,
    MONO_PALETTE,
  ),
  'color-8': makeStyle(
    'color-8',
    'Color 8×8',
    'An 8×8 mosaic: every 4 digest bits pick one of 16 palette colors.',
    8,
    4,
    COLOR_PALETTE,
  ),
};

/** The default style. Mono 16×16 renders the whole digest as crisp black & white. */
export const DEFAULT_STYLE: StyleId = 'mono-16';

/** All style ids in display order. */
export const STYLE_IDS: readonly StyleId[] = ['mono-16', 'color-8'];

/** All styles in display order. */
export const STYLES: readonly GlyphStyle[] = STYLE_IDS.map((id) => PROVIDERS[id]);

/** True when `id` is a known style id. */
export function isStyleId(id: string): id is StyleId {
  return Object.hasOwn(PROVIDERS, id);
}

/** Look up a style. @throws {UnknownAlgorithmError} for unknown ids. */
export function getStyle(id: StyleId): GlyphStyle {
  const style = PROVIDERS[id];
  if (!style) {
    throw new UnknownAlgorithmError('style', id, STYLE_IDS);
  }
  return style;
}
