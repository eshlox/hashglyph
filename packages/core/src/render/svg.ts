import type { Glyph } from '../glyph.js';
import type { Grid } from '../grid.js';
import { GRID_SIZE } from '../version.js';
import { assertSafeColor } from './color.js';
import { escapeXml } from './xml.js';

/** Pixel shape for rendered cells. */
export type PixelShape = 'square' | 'rounded';

/** Options controlling SVG output. All have safe, brand-accurate defaults. */
export interface SvgOptions {
  /** Foreground (pixel) color. Default `#000000`. */
  readonly fg?: string;
  /** Background color, or `null`/`'transparent'` for none. Default `#ffffff`. */
  readonly bg?: string | null;
  /** Cell shape. Default `square` (with crisp edges). */
  readonly pixel?: PixelShape;
  /** Corner radius for rounded pixels, as a fraction (0–0.5) of a cell. Default 0.5. */
  readonly radius?: number;
  /** Quiet-zone padding around the grid, in cells. Default 1. */
  readonly padding?: number;
  /** Rendered pixels per cell, used for the width/height attributes. Default 64. */
  readonly scale?: number;
  /** Accessible `<title>`. Default derived from the glyph's seed. */
  readonly title?: string;
  /** `aria-label`. Default derived from the glyph's seed. */
  readonly label?: string;
}

const DEFAULTS = {
  fg: '#000000',
  bg: '#ffffff' as string | null,
  pixel: 'square' as PixelShape,
  radius: 0.5,
  padding: 1,
  scale: 64,
} satisfies Partial<SvgOptions>;

function clampRadius(radius: number): number {
  if (!Number.isFinite(radius)) return 0;
  return Math.min(0.5, Math.max(0, radius));
}

function clampPadding(padding: number): number {
  if (!Number.isFinite(padding)) return 0;
  return Math.max(0, Math.floor(padding));
}

function clampScale(scale: number): number {
  if (!Number.isFinite(scale) || scale <= 0) return DEFAULTS.scale;
  return Math.floor(scale);
}

/** Build the `<rect>` body for all on-cells, in module (cell) coordinates. */
function renderCells(grid: Grid, padding: number, shape: PixelShape, radius: number): string {
  const rects: string[] = [];
  const rx = shape === 'rounded' ? ` rx="${+radius.toFixed(4)}"` : '';
  for (let y = 0; y < grid.length; y += 1) {
    const row = grid[y];
    if (!row) continue;
    for (let x = 0; x < row.length; x += 1) {
      if (!row[x]) continue;
      const px = padding + x;
      const py = padding + y;
      rects.push(`    <rect x="${px}" y="${py}" width="1" height="1"${rx}/>`);
    }
  }
  return rects.join('\n');
}

/**
 * Render a glyph as a standalone, self-contained SVG string.
 *
 * The SVG uses a module-unit `viewBox` (1 unit = 1 cell) so it is fully
 * resolution-independent. It contains no external references, scripts, or
 * `<foreignObject>`; all user-influenced text is XML-escaped. Safe to inline in
 * HTML, write to a `.svg` file, or rasterize via canvas/sharp.
 */
export function renderSvg(glyph: Glyph, options: SvgOptions = {}): string {
  const fg = assertSafeColor('fg', options.fg ?? DEFAULTS.fg);
  const bgRaw = options.bg === undefined ? DEFAULTS.bg : options.bg;
  const bg = bgRaw === null ? null : assertSafeColor('bg', bgRaw);
  const shape = options.pixel ?? DEFAULTS.pixel;
  const radius = clampRadius(options.radius ?? DEFAULTS.radius);
  const padding = clampPadding(options.padding ?? DEFAULTS.padding);
  const scale = clampScale(options.scale ?? DEFAULTS.scale);

  const gridSize = glyph.grid.length || GRID_SIZE;
  const modules = gridSize + padding * 2;
  const size = modules * scale;

  const title = escapeXml(options.title ?? `HashGlyph — ${glyph.seed}`);
  const label = escapeXml(options.label ?? `Deterministic pixel glyph for "${glyph.seed}"`);

  const background =
    bg === null ? '' : `  <rect width="${modules}" height="${modules}" fill="${bg}"/>\n`;
  const crisp = shape === 'square' ? ' shape-rendering="crispEdges"' : '';
  const cells = renderCells(glyph.grid, padding, shape, radius);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${modules} ${modules}" width="${size}" height="${size}" role="img" aria-label="${label}">
  <title>${title}</title>
${background}  <g fill="${fg}"${crisp}>
${cells}
  </g>
</svg>
`;
}
