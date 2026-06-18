import type { Glyph } from '../glyph.js';
import type { Grid } from '../grid.js';
import type { Palette } from '../style/types.js';
import { assertSafeColor } from './color.js';
import { escapeXml } from './xml.js';

/** Pixel shape for rendered cells. */
export type PixelShape = 'square' | 'rounded';

/** Options controlling SVG output. All have safe, brand-accurate defaults. */
export interface SvgOptions {
  /**
   * Foreground (pixel) color for monochrome glyphs. Default `#000000`. Ignored by
   * multi-color styles, which carry their own fixed palette.
   */
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

/**
 * Resolve the palette actually painted. For a monochrome (2-entry) palette the
 * `fg` option overrides the ink; multi-color palettes are used as-is. Every
 * painted color is validated.
 */
function resolvePalette(base: Palette, fg: string | undefined): (string | null)[] {
  const palette = base.slice();
  if (fg !== undefined && palette.length === 2) {
    palette[1] = fg;
  }
  return palette.map((color, index) =>
    color === null ? null : assertSafeColor(`palette[${index}]`, color),
  );
}

/** Build a `<g fill>` group per palette color, holding that color's cells. */
function renderGroups(
  grid: Grid,
  palette: readonly (string | null)[],
  padding: number,
  shape: PixelShape,
  radius: number,
): string {
  const rx = shape === 'rounded' ? ` rx="${+radius.toFixed(4)}"` : '';
  const crisp = shape === 'square' ? ' shape-rendering="crispEdges"' : '';
  const byColor = new Map<number, string[]>();
  for (let y = 0; y < grid.length; y += 1) {
    const row = grid[y];
    if (!row) continue;
    for (let x = 0; x < row.length; x += 1) {
      const value = row[x] ?? 0;
      if (!value || palette[value] == null) continue;
      const rect = `    <rect x="${padding + x}" y="${padding + y}" width="1" height="1"${rx}/>`;
      let bucket = byColor.get(value);
      if (!bucket) {
        bucket = [];
        byColor.set(value, bucket);
      }
      bucket.push(rect);
    }
  }
  return [...byColor.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([value, rects]) => `  <g fill="${palette[value]}"${crisp}>\n${rects.join('\n')}\n  </g>`)
    .join('\n');
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
  const fg = options.fg === undefined ? undefined : assertSafeColor('fg', options.fg);
  const bgRaw = options.bg === undefined ? DEFAULTS.bg : options.bg;
  const bg = bgRaw === null ? null : assertSafeColor('bg', bgRaw);
  const shape = options.pixel ?? DEFAULTS.pixel;
  const radius = clampRadius(options.radius ?? DEFAULTS.radius);
  const padding = clampPadding(options.padding ?? DEFAULTS.padding);
  const scale = clampScale(options.scale ?? DEFAULTS.scale);

  const palette = resolvePalette(glyph.palette, fg ?? DEFAULTS.fg);
  const gridSize = glyph.grid.length;
  const modules = gridSize + padding * 2;
  const size = modules * scale;

  const title = escapeXml(options.title ?? `HashGlyph glyph for "${glyph.seed}"`);
  const label = escapeXml(options.label ?? `Deterministic pixel glyph for "${glyph.seed}"`);

  const background =
    bg === null ? '' : `  <rect width="${modules}" height="${modules}" fill="${bg}"/>\n`;
  const groups = renderGroups(glyph.grid, palette, padding, shape, radius);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${modules} ${modules}" width="${size}" height="${size}" role="img" aria-label="${label}">
  <title>${title}</title>
${background}${groups}
</svg>
`;
}
