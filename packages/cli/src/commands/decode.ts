import { decodeGlyphHex, type StyleId } from '@eshlox/hashglyph-core';
import pc from 'picocolors';
import type { CommandResult } from '../artifacts.js';
import { parseSvgGrid } from '../svg-grid.js';

export interface DecodeInput {
  svg: string;
  style: StyleId;
}

/** `decode`: read the identity digest back out of a HashGlyph SVG. */
export function runDecode(input: DecodeInput): CommandResult {
  const grid = parseSvgGrid(input.svg, input.style);
  const digest = decodeGlyphHex(grid, input.style);
  return {
    artifacts: [],
    summary: [
      `${pc.dim('style    ')}${input.style}`,
      `${pc.dim('digest   ')}${digest}`,
      pc.dim('(the digest is the identity; the original seed cannot be recovered)'),
    ],
  };
}
