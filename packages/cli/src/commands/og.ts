import { generateGlyph } from '@eshlox/hashglyph-core';
import type { CommandResult } from '../artifacts.js';
import { type OgOptions, renderOgSvg } from '../og-image.js';
import type { ResolvedGlyphOptions } from '../options.js';
import { slugify } from '../paths.js';
import { svgToPngSized } from '../render-png.js';

export interface OgInput {
  seed: string;
  options: ResolvedGlyphOptions;
  og: OgOptions;
}

/** `og`: render a 1200×630 Open Graph card PNG (and its source SVG). */
export async function runOg(input: OgInput): Promise<CommandResult> {
  const glyph = generateGlyph({
    seed: input.seed,
    hash: input.options.hash,
    grammar: input.options.grammar,
  });
  const svg = renderOgSvg(glyph, input.og);
  const png = await svgToPngSized(svg, 1200, 630);
  const base = slugify(glyph.normalized);

  return {
    artifacts: [
      { name: `${base}-og.svg`, data: svg },
      { name: `${base}-og.png`, data: png },
    ],
    summary: [`Open Graph card (1200×630) for "${glyph.normalized}"`],
  };
}
