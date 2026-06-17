import type { Glyph } from '@eshlox/hashglyph-core';
import { measureText, textRects } from './pixel-font.js';

/** Customizable text for the Open Graph card. */
export interface OgOptions {
  title?: string;
  slogan?: string;
  url?: string;
}

const W = 1200;
const H = 630;

const COLORS = {
  bgTop: '#0b0e14',
  bgBottom: '#11161f',
  accent: '#5eead4',
  card: '#f8fafc',
  ink: '#0b0e14',
  title: '#f8fafc',
  muted: '#94a3b8',
  url: '#e2e8f0',
};

function pixelText(text: string, x: number, y: number, scale: number, color: string): string {
  return `  <g fill="${color}">${textRects(text, x, y, scale)}</g>`;
}

/** Largest integer scale (1..maxScale) at which `text` fits within `maxWidth`. */
function fitScale(text: string, maxWidth: number, maxScale: number): number {
  for (let scale = maxScale; scale > 1; scale -= 1) {
    if (measureText(text, scale) <= maxWidth) return scale;
  }
  return 1;
}

/**
 * Build a 1200×630 Open Graph card SVG: the glyph on a light card to the left;
 * wordmark, slogan, URL and a provenance line set in the built-in pixel font to
 * the right. No system fonts required, so output is byte-reproducible anywhere.
 */
export function renderOgSvg(glyph: Glyph, options: OgOptions = {}): string {
  const title = options.title ?? 'HashGlyph';
  const slogan = options.slogan ?? 'Deterministic pixel glyphs.';
  const url = options.url ?? 'hashglyph.eshlox.net';
  const sub = `${glyph.hashId} x ${glyph.grammarId}`;

  // Glyph card (left).
  const card = { x: 80, y: 115, size: 400, pad: 46 };
  const n = glyph.grid.length;
  const cell = (card.size - card.pad * 2) / n;
  const ox = card.x + card.pad;
  const oy = card.y + card.pad;
  const glyphRects: string[] = [];
  for (let y = 0; y < n; y += 1) {
    const row = glyph.grid[y];
    if (!row) continue;
    for (let x = 0; x < row.length; x += 1) {
      if (!row[x]) continue;
      const px = +(ox + x * cell).toFixed(2);
      const py = +(oy + y * cell).toFixed(2);
      const c = +cell.toFixed(2);
      glyphRects.push(`    <rect x="${px}" y="${py}" width="${c}" height="${c}"/>`);
    }
  }

  // Right column text block (pixel font), each line auto-fitted to the canvas.
  const tx = 520;
  const maxW = W - tx - 36;
  const seedLine = `seed "${glyph.normalized}"`;
  const lines = [
    pixelText(title, tx, 168, fitScale(title, maxW, 11), COLORS.title),
    pixelText(slogan, tx, 300, fitScale(slogan, maxW, 4), COLORS.muted),
    pixelText(url, tx, 372, fitScale(url, maxW, 6), COLORS.accent),
    pixelText(seedLine, tx, 448, fitScale(seedLine, maxW, 3), COLORS.muted),
    pixelText(sub, tx, 484, fitScale(sub, maxW, 3), COLORS.muted),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${COLORS.bgTop}"/>
      <stop offset="1" stop-color="${COLORS.bgBottom}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect x="0" y="0" width="${W}" height="8" fill="${COLORS.accent}"/>
  <rect x="${card.x}" y="${card.y}" width="${card.size}" height="${card.size}" rx="36" fill="${COLORS.card}"/>
  <g fill="${COLORS.ink}" shape-rendering="crispEdges">
${glyphRects.join('\n')}
  </g>
${lines.join('\n')}
</svg>
`;
}
