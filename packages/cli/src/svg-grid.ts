import { emptyGrid, type Grid, getStyle, type StyleId, setCell } from '@eshlox/hashglyph-core';

const VIEWBOX = /viewBox="0 0 (\d+) \d+"/;
const GROUP = /<g fill="([^"]+)"[^>]*>([\s\S]*?)<\/g>/g;
const CELL = /<rect x="(\d+)" y="(\d+)" width="1"/g;

/**
 * Reconstruct a glyph grid from a HashGlyph SVG. The SVG is our own lossless
 * output, so this is exact (no rasterization): each `<g fill>` group's cells map
 * to a palette index. For the monochrome style any painted cell is index 1, so a
 * recolored mono glyph still decodes; multi-color cells map by their fill.
 *
 * @throws {Error} when the SVG is not a HashGlyph SVG of the given style.
 */
export function parseSvgGrid(svg: string, styleId: StyleId): Grid {
  const style = getStyle(styleId);
  const viewBox = VIEWBOX.exec(svg);
  if (!viewBox?.[1]) {
    throw new Error('Not a HashGlyph SVG: missing viewBox.');
  }
  const modules = Number(viewBox[1]);
  const padding = (modules - style.size) / 2;
  if (!Number.isInteger(padding) || padding < 0) {
    throw new Error(
      `SVG grid (${modules} modules) does not match style "${styleId}" (size ${style.size}).`,
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
    const value = isMono ? 1 : (colorToIndex.get(fill) ?? 0);
    if (!value) continue;
    for (const cell of group[2]?.matchAll(CELL) ?? []) {
      setCell(grid, Number(cell[1]) - padding, Number(cell[2]) - padding, value);
    }
  }
  return grid;
}
