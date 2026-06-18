import { generateGlyph, gridToAscii } from '@eshlox/hashglyph-core';
import pc from 'picocolors';
import type { CommandResult } from '../artifacts.js';
import type { ResolvedGlyphOptions } from '../options.js';

export interface AsciiInput {
  seed: string;
  options: ResolvedGlyphOptions;
  color: boolean;
}

/** `ascii`: print the glyph to the terminal. No files written. */
export function runAscii(input: AsciiInput): CommandResult {
  const glyph = generateGlyph({
    seed: input.seed,
    hash: input.options.hash,
    style: input.options.style,
  });
  const art = gridToAscii(glyph.grid, '██', '  ');
  const block = input.color ? pc.cyan(art) : art;

  return {
    artifacts: [],
    summary: [
      '',
      block,
      '',
      `${pc.dim('seed     ')}${glyph.normalized}`,
      `${pc.dim('algo     ')}${glyph.hashId} × ${glyph.styleId}`,
      `${pc.dim('digest   ')}${glyph.digestHex.slice(0, 32)}…`,
    ],
  };
}
