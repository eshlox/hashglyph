#!/usr/bin/env node
/**
 * Mint HashGlyph's own frozen brand assets (the glyph for the seed `hashglyph`).
 *
 * Writes byte-reproducible masters into `brand/assets/` and the exact files the
 * website references into `apps/web/public/`. Run via `pnpm brand:generate`;
 * `pnpm brand:verify` regenerates and asserts `git diff --exit-code`, proving
 * the committed binaries are reproducible.
 *
 * Requires the workspace packages to be built first (`pnpm -r build`).
 */
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderOgSvg, svgToPng, svgToPngSized } from '../packages/cli/dist/index.js';
import {
  encodeIco,
  generateGlyph,
  MATERIAL_SCHEMA,
  renderQrSvg,
  renderSvg,
} from '../packages/core/dist/index.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const BRAND = join(ROOT, 'brand/assets');
const PUBLIC = join(ROOT, 'apps/web/public');
const FAVICONS = join(PUBLIC, 'favicons');

const SEED = 'hashglyph';
const BASE = 'hashglyph-deterministic-glyph';
const SITE = 'https://hashglyph.eshlox.net';

/** Write the same bytes/text to one or more destination paths. */
async function emit(data, ...paths) {
  const body = typeof data === 'string' ? data : Buffer.from(data);
  for (const path of paths) {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, body);
  }
}

function metadataJson(glyph) {
  return `${JSON.stringify(
    {
      seed: glyph.seed,
      normalized: glyph.normalized,
      hashId: glyph.hashId,
      grammarId: glyph.grammarId,
      materialId: glyph.materialId,
      material: glyph.material,
      digestHex: glyph.digestHex,
      grid: glyph.grid,
      decisions: glyph.decisions,
      schema: MATERIAL_SCHEMA,
      generator: '@eshlox/hashglyph-cli',
    },
    null,
    2,
  )}\n`;
}

function webmanifest() {
  return `${JSON.stringify(
    {
      name: 'HashGlyph',
      short_name: 'HashGlyph',
      icons: [
        { src: '/favicons/hashglyph-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/favicons/hashglyph-512.png', sizes: '512x512', type: 'image/png' },
      ],
      theme_color: '#0b0e14',
      background_color: '#ffffff',
      display: 'standalone',
      start_url: '/',
    },
    null,
    2,
  )}\n`;
}

async function main() {
  // Clean the generated dirs so removed files don't linger.
  await rm(BRAND, { recursive: true, force: true });
  await rm(FAVICONS, { recursive: true, force: true });

  const glyph = generateGlyph({ seed: SEED });
  const masterSvg = renderSvg(glyph, { padding: 1, scale: 64 });

  // --- Masters (brand/assets) ----------------------------------------------
  await emit(masterSvg, join(BRAND, `${BASE}.svg`));
  await emit(metadataJson(glyph), join(BRAND, `${BASE}.json`));

  // Favicon SVG (used directly by the site) + ICO + PNG set.
  await emit(masterSvg, join(BRAND, 'favicon.svg'), join(PUBLIC, 'favicon.svg'));

  const faviconSizes = [16, 32, 48, 180, 192, 512];
  const pngs = new Map();
  for (const size of faviconSizes) {
    const png = await svgToPng(masterSvg, size);
    pngs.set(size, png);
    await emit(png, join(BRAND, `${SEED}-${size}.png`), join(FAVICONS, `${SEED}-${size}.png`));
  }
  await emit(
    pngs.get(180),
    join(BRAND, 'apple-touch-icon.png'),
    join(FAVICONS, 'apple-touch-icon.png'),
  );

  const ico = encodeIco([16, 32, 48].map((size) => ({ size, png: pngs.get(size) })));
  await emit(ico, join(BRAND, 'favicon.ico'), join(PUBLIC, 'favicon.ico'));

  await emit(webmanifest(), join(BRAND, 'site.webmanifest'), join(FAVICONS, 'site.webmanifest'));

  // --- Open Graph card ------------------------------------------------------
  const ogSvg = renderOgSvg(glyph, { url: 'hashglyph.eshlox.net' });
  const ogPng = await svgToPngSized(ogSvg, 1200, 630);
  await emit(ogSvg, join(BRAND, 'og-image.svg'));
  await emit(ogPng, join(BRAND, 'og-image.png'), join(PUBLIC, 'og-image.png'));

  // --- QR mark (brand showcase) --------------------------------------------
  const qrSvg = renderQrSvg(SITE, glyph, { glyphCoverage: 0.24 });
  const qrPng = await svgToPng(qrSvg, 1024);
  await emit(qrSvg, join(BRAND, `${SEED}-qr.svg`));
  await emit(qrPng, join(BRAND, `${SEED}-qr.png`));

  // --- robots.txt -----------------------------------------------------------
  await emit(
    `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap-index.xml\n`,
    join(PUBLIC, 'robots.txt'),
  );

  console.log('Brand assets generated:');
  console.log(`  digest  ${glyph.digestHex.slice(0, 32)}…`);
  console.log(`  brand   ${BRAND}`);
  console.log(`  public  ${PUBLIC}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
