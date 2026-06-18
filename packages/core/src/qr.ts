import { Byte, Charset, Encoder } from '@nuintun/qrcode';
import type { Glyph } from './glyph.js';
import { assertSafeColor } from './render/color.js';
import { escapeXml } from './render/xml.js';

/** QR error-correction level. `H` (30%) is required when embedding a glyph. */
export type QrLevel = 'L' | 'M' | 'Q' | 'H';

/** Options for {@link renderQrSvg}. */
export interface QrOptions {
  /** Error-correction level. Default `H` (needed for a center logo). */
  readonly level?: QrLevel;
  /** Module (dark) color. Default `#000000`. */
  readonly fg?: string;
  /** Background color. Default `#ffffff`. */
  readonly bg?: string;
  /** Quiet-zone width in modules. Default 4 (the spec minimum). */
  readonly quietZone?: number;
  /** Glyph box width as a fraction of the QR size. Clamped to ≤ 0.3. Default 0.3. */
  readonly glyphCoverage?: number;
  /** Glyph pixel color. Defaults to `fg`. */
  readonly glyphFg?: string;
  /** Color of the cleared pad behind the glyph. Defaults to `bg`. */
  readonly glyphBg?: string;
}

const fmt = (n: number): string => String(+n.toFixed(3));

/** Encode a QR matrix for `data` at the given level. */
export function buildQrMatrix(data: string, level: QrLevel = 'H') {
  const encoder = new Encoder({ level });
  return encoder.encode(new Byte(data, Charset.UTF_8));
}

/**
 * Render a QR code as a self-contained SVG, optionally with a HashGlyph
 * composited in the centre. The glyph area (plus a one-module pad) is cleared
 * to the background and kept small (≤ 30% of the code) so that, combined with
 * error-correction level H, the code still scans. The three finder patterns in
 * the corners are never covered.
 */
export function renderQrSvg(data: string, glyph: Glyph | null, options: QrOptions = {}): string {
  const level = glyph ? 'H' : (options.level ?? 'H');
  const fg = assertSafeColor('fg', options.fg ?? '#000000');
  const bg = assertSafeColor('bg', options.bg ?? '#ffffff');
  const glyphFg = assertSafeColor('glyphFg', options.glyphFg ?? fg);
  const glyphBg = assertSafeColor('glyphBg', options.glyphBg ?? bg);
  const quietRaw = options.quietZone ?? 4;
  const quiet = Number.isFinite(quietRaw) ? Math.max(0, Math.floor(quietRaw)) : 4;
  const coverageRaw = options.glyphCoverage ?? 0.3;
  const coverage = Number.isFinite(coverageRaw) ? Math.min(0.3, Math.max(0.1, coverageRaw)) : 0.3;

  const qr = buildQrMatrix(data, level);
  const n = qr.size;
  const total = n + quiet * 2;

  // Centre clearing box (only when a glyph is present).
  let span = 0;
  let boxOrigin = 0;
  let clearOrigin = 0;
  let clearSpan = 0;
  if (glyph) {
    span = Math.round(n * coverage);
    if (span % 2 !== n % 2) span += 1; // match parity so the box centres cleanly
    const center = quiet + n / 2;
    boxOrigin = center - span / 2;
    clearSpan = span + 2; // one-module pad on each side
    clearOrigin = center - clearSpan / 2;
  }

  const inClear = (mx: number, my: number): boolean =>
    glyph !== null &&
    mx >= clearOrigin &&
    mx < clearOrigin + clearSpan &&
    my >= clearOrigin &&
    my < clearOrigin + clearSpan;

  const modules: string[] = [];
  for (let y = 0; y < n; y += 1) {
    for (let x = 0; x < n; x += 1) {
      if (qr.get(x, y) !== 1) continue;
      const mx = quiet + x;
      const my = quiet + y;
      if (inClear(mx, my)) continue;
      modules.push(`    <rect x="${mx}" y="${my}" width="1" height="1"/>`);
    }
  }

  let overlay = '';
  if (glyph) {
    const cell = span / glyph.grid.length;
    const cells: string[] = [];
    for (let y = 0; y < glyph.grid.length; y += 1) {
      const row = glyph.grid[y];
      if (!row) continue;
      for (let x = 0; x < row.length; x += 1) {
        if (!row[x]) continue;
        cells.push(
          `    <rect x="${fmt(boxOrigin + x * cell)}" y="${fmt(boxOrigin + y * cell)}" width="${fmt(cell)}" height="${fmt(cell)}"/>`,
        );
      }
    }
    overlay = `  <rect x="${fmt(clearOrigin)}" y="${fmt(clearOrigin)}" width="${fmt(clearSpan)}" height="${fmt(clearSpan)}" fill="${glyphBg}"/>
  <g fill="${glyphFg}" shape-rendering="crispEdges">
${cells.join('\n')}
  </g>
`;
  }

  const label = escapeXml(`QR code for ${data}`);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${total * 8}" height="${total * 8}" role="img" aria-label="${label}">
  <title>${label}</title>
  <rect width="${total}" height="${total}" fill="${bg}"/>
  <g fill="${fg}" shape-rendering="crispEdges">
${modules.join('\n')}
  </g>
${overlay}</svg>
`;
}
