import { GRAMMARS, HASHES } from '@eshlox/hashglyph-core';
import pc from 'picocolors';
import type { CommandResult } from '../artifacts.js';

/** `list` — show every available hash and grammar. No files written. */
export function runList(): CommandResult {
  const summary: string[] = [pc.bold('Hashes:')];
  for (const h of HASHES) {
    const tag = h.id === 'blake3' ? pc.green(' (default)') : '';
    summary.push(`  ${pc.cyan(h.id.padEnd(12))}${h.label}${tag}`);
    summary.push(`  ${' '.repeat(12)}${pc.dim(h.description)}`);
  }
  summary.push('', pc.bold('Grammars:'));
  for (const g of GRAMMARS) {
    const tag = g.id === 'core-accents-v1' ? pc.green(' (default, canonical)') : '';
    summary.push(`  ${pc.cyan(g.id.padEnd(22))}${g.label}${tag}`);
    summary.push(`  ${' '.repeat(22)}${pc.dim(g.description)}`);
  }
  summary.push(
    '',
    pc.dim(
      `${HASHES.length} hashes × ${GRAMMARS.length} grammars = ${HASHES.length * GRAMMARS.length} combinations.`,
    ),
  );
  return { artifacts: [], summary };
}
