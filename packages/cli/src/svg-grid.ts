import { emptyGrid, type Grid, getStyle, type StyleId } from '@eshlox/hashglyph-core';

const VIEWBOX = /viewBox="0 0 (\d+) (\d+)"/;
const GROUP = /<g fill="([^"]+)"[^>]*>([\s\S]*?)<\/g>/g;
const CELL = /<rect x="(\d+)" y="(\d+)" width="1"/g;

/** A user-facing failure parsing a glyph SVG (printed cleanly, no stack trace). */
export class SvgParseError extends Error {
  override readonly name = 'SvgParseError';
}

/**
 * Reconstruct a glyph grid from a HashGlyph SVG. The SVG is our own lossless
 * output, so this is exact (no rasterization): each `<g fill>` group's cells map
 * to a palette index. For the monochrome style any painted cell is index 1 (so a
 * recolored mono glyph still decodes); multi-color cells map by their fill.
 *
 * Parsing is strict: the viewBox must be square and sized for the style, every
 * painted cell must fall inside the grid, and (for color styles) every fill must
 * be a known palette color. This rejects augmented or tampered SVGs rather than
 * silently decoding the canonical cells out of them. It is not a sanitizer: it
 * confirms the encoded grid, not that the file is byte-identical canonical output.
 *
 * @throws {SvgParseError} when the SVG is not a well-formed HashGlyph glyph of `styleId`.
 */
export function parseSvgGrid(svg: string, styleId: StyleId): Grid {
  const style = getStyle(styleId);
  const viewBox = VIEWBOX.exec(svg);
  if (!viewBox?.[1] || !viewBox[2]) {
    throw new SvgParseError('Not a HashGlyph SVG: missing or malformed viewBox.');
  }
  const width = Number(viewBox[1]);
  const height = Number(viewBox[2]);
  if (width !== height) {
    throw new SvgParseError(`Not a HashGlyph glyph: viewBox is not square (${width}x${height}).`);
  }
  const padding = (width - style.size) / 2;
  if (!Number.isInteger(padding) || padding < 0) {
    throw new SvgParseError(
      `SVG grid (${width} modules) does not match style "${styleId}" (size ${style.size}).`,
    );
  }

  const colorToIndex = new Map<string, number>();
  style.palette.forEach((color, index) => {
    if (color) colorToIndex.set(color.toLowerCase(), index);
  });
  const isMono = style.palette.length === 2;

  const grid = emptyGrid(style.size);
  for (const group of svg.matchAll(GROUP)) {
    const fill = group[1]?.toLowerCase() ?? '';
    let value: number;
    if (isMono) {
      value = 1;
    } else {
      const index = colorToIndex.get(fill);
      if (index === undefined) {
        throw new SvgParseError(`Unknown fill "${fill}" for style "${styleId}".`);
      }
      value = index;
    }
    for (const cell of group[2]?.matchAll(CELL) ?? []) {
      const x = Number(cell[1]) - padding;
      const y = Number(cell[2]) - padding;
      if (x < 0 || y < 0 || x >= style.size || y >= style.size) {
        throw new SvgParseError(`Cell at (${cell[1]}, ${cell[2]}) is outside the ${styleId} grid.`);
      }
      const row = grid[y];
      if (row) row[x] = value;
    }
  }
  return grid;
}
