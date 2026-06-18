import { decodeGlyphHex, type HashId, type StyleId, verifyGlyph } from '@eshlox/hashglyph-core';
import pc from 'picocolors';
import type { CommandResult } from '../artifacts.js';
import { parseSvgGrid } from '../svg-grid.js';

export interface VerifyInput {
  svg: string;
  style: StyleId;
  seed: string;
  hash: HashId;
}

/** `verify`: prove a HashGlyph SVG is the glyph a given (seed, hash) produces. */
export function runVerify(input: VerifyInput): CommandResult & { ok: boolean } {
  const grid = parseSvgGrid(input.svg, input.style);
  const ok = verifyGlyph(grid, input.style, input.seed, input.hash);
  return {
    ok,
    artifacts: [],
    summary: [
      ok ? pc.green('✓ valid') : pc.red('✗ invalid'),
      `${pc.dim('seed     ')}${input.seed}`,
      `${pc.dim('algo     ')}${input.hash} × ${input.style}`,
      `${pc.dim('glyph    ')}${decodeGlyphHex(grid, input.style)}`,
    ],
  };
}
