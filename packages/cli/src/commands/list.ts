import { HASHES, type HashTier, STYLES } from '@eshlox/hashglyph-core';
import pc from 'picocolors';
import type { CommandResult } from '../artifacts.js';

/** Color a hash's tier so the collision-unsafe ones stand out. */
function tierTag(tier: HashTier): string {
  if (tier === 'strong') return pc.green('strong');
  if (tier === 'reduced') return pc.yellow('reduced');
  return pc.red('broken — not collision-safe');
}

/** `list`: show every available hash (with tier) and render style. No files written. */
export function runList(): CommandResult {
  const summary: string[] = [pc.bold('Hashes:')];
  for (const h of HASHES) {
    const tag = h.id === 'blake3' ? pc.green(' (default)') : '';
    summary.push(`  ${pc.cyan(h.id.padEnd(12))}${h.label}  [${tierTag(h.tier)}]${tag}`);
    summary.push(`  ${' '.repeat(12)}${pc.dim(h.description)}`);
  }
  summary.push('', pc.bold('Styles:'));
  for (const s of STYLES) {
    const tag = s.id === 'mono-16' ? pc.green(' (default)') : '';
    summary.push(`  ${pc.cyan(s.id.padEnd(12))}${s.label}${tag}`);
    summary.push(`  ${' '.repeat(12)}${pc.dim(s.description)}`);
  }
  summary.push(
    '',
    pc.dim(
      'Every (hash × style) is a deterministic, reversible 256-bit glyph. Two seeds ' +
        'colliding is infeasible for strong hashes; broken hashes are for fun only.',
    ),
  );
  return { artifacts: [], summary };
}
