import { generateGlyph, gridToAscii, MATERIAL_SCHEMA, renderSvg } from '@eshlox/hashglyph-core';
import type { Artifact, CommandResult } from '../artifacts.js';
import type { ResolvedGlyphOptions } from '../options.js';
import { slugify } from '../paths.js';
import { svgToPng } from '../render-png.js';

export interface GenerateInput {
  seed: string;
  options: ResolvedGlyphOptions;
  sizes: readonly number[];
  json: boolean;
  ascii: boolean;
}

/** Build the deterministic JSON metadata sidecar (fixed key order = stable bytes). */
function metadataJson(glyph: ReturnType<typeof generateGlyph>): string {
  const meta = {
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
  };
  return `${JSON.stringify(meta, null, 2)}\n`;
}

/** `generate` — the core command: SVG (+ optional JSON + PNGs) for a seed. */
export async function runGenerate(input: GenerateInput): Promise<CommandResult> {
  const { seed, options, sizes, json, ascii } = input;
  const glyph = generateGlyph({ seed, hash: options.hash, grammar: options.grammar });
  const svg = renderSvg(glyph, options.svg);
  const base = slugify(glyph.normalized);

  const artifacts: Artifact[] = [{ name: `${base}.svg`, data: svg }];
  const summary: string[] = [];

  if (json) {
    artifacts.push({ name: `${base}.json`, data: metadataJson(glyph) });
  }

  for (const size of sizes) {
    const png = await svgToPng(svg, size);
    artifacts.push({ name: `${base}-${size}.png`, data: png });
  }

  if (ascii) {
    summary.push('', gridToAscii(glyph.grid), '');
  }
  summary.push(
    `seed       ${glyph.normalized}`,
    `algorithm  ${glyph.hashId} × ${glyph.grammarId}`,
    `digest     ${glyph.digestHex.slice(0, 32)}…`,
  );

  return { artifacts, summary };
}
