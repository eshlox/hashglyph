import { encodeIco, generateGlyph, renderSvg } from '@eshlox/hashglyph-core';
import type { Artifact, CommandResult } from '../artifacts.js';
import type { ResolvedGlyphOptions } from '../options.js';
import { slugify } from '../paths.js';
import { svgToPng } from '../render-png.js';

export interface FaviconInput {
  seed: string;
  options: ResolvedGlyphOptions;
}

/** PNG sizes emitted for a complete favicon / PWA icon set. */
const FAVICON_PNGS = [16, 32, 48, 180, 192, 512] as const;
/** Sizes packed into favicon.ico. */
const ICO_SIZES = [16, 32, 48] as const;

function webmanifest(name: string): string {
  const manifest = {
    name: 'HashGlyph',
    short_name: 'HashGlyph',
    icons: [
      { src: `${name}-192.png`, sizes: '192x192', type: 'image/png' },
      { src: `${name}-512.png`, sizes: '512x512', type: 'image/png' },
    ],
    theme_color: '#0b0e14',
    background_color: '#ffffff',
    display: 'standalone',
  };
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

/** `favicon`: a full favicon/PWA set: PNGs + favicon.ico + site.webmanifest. */
export async function runFavicon(input: FaviconInput): Promise<CommandResult> {
  const glyph = generateGlyph({
    seed: input.seed,
    hash: input.options.hash,
    grammar: input.options.grammar,
  });
  const svg = renderSvg(glyph, input.options.svg);
  const base = slugify(glyph.normalized);

  const artifacts: Artifact[] = [{ name: `${base}.svg`, data: svg }];

  const pngBySize = new Map<number, Uint8Array>();
  for (const size of FAVICON_PNGS) {
    const png = await svgToPng(svg, size);
    pngBySize.set(size, png);
    artifacts.push({ name: `${base}-${size}.png`, data: png });
  }
  // apple-touch-icon is conventionally the 180px PNG.
  const apple = pngBySize.get(180);
  if (apple) artifacts.push({ name: 'apple-touch-icon.png', data: apple });

  const icoEntries = ICO_SIZES.map((size) => {
    const png = pngBySize.get(size);
    if (!png) throw new Error(`internal: missing ${size}px PNG for ICO`);
    return { size, png };
  });
  artifacts.push({ name: 'favicon.ico', data: encodeIco(icoEntries) });
  artifacts.push({ name: 'site.webmanifest', data: webmanifest(base) });

  return {
    artifacts,
    summary: [
      `favicon set for "${glyph.normalized}"`,
      `  ${FAVICON_PNGS.length} PNGs + favicon.ico (${ICO_SIZES.join('/')}) + manifest`,
    ],
  };
}
