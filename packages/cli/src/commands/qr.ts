import { generateGlyph, renderQrSvg } from '@eshlox/hashglyph-core';
import type { CommandResult } from '../artifacts.js';
import type { ResolvedGlyphOptions } from '../options.js';
import { slugify } from '../paths.js';
import { svgToPng } from '../render-png.js';

export interface QrInput {
  url: string;
  seed: string | null;
  options: ResolvedGlyphOptions;
  size: number;
}

/** `qr` — a QR code (optionally with a centered glyph) as SVG + PNG. */
export async function runQr(input: QrInput): Promise<CommandResult> {
  const glyph = input.seed
    ? generateGlyph({ seed: input.seed, hash: input.options.hash, grammar: input.options.grammar })
    : null;
  const svg = renderQrSvg(input.url, glyph);
  const png = await svgToPng(svg, input.size);
  const base = glyph ? `${slugify(glyph.normalized)}-qr` : 'qr';

  return {
    artifacts: [
      { name: `${base}.svg`, data: svg },
      { name: `${base}.png`, data: png },
    ],
    summary: [
      `QR code for ${input.url}`,
      glyph ? `  with centered "${glyph.normalized}" glyph (ECC level H)` : '  plain (no glyph)',
    ],
  };
}
