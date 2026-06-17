import { emptyGrid, setCell } from '../grid.js';
import { GRID_SIZE } from '../version.js';
import type { GlyphGrammar } from './types.js';

/**
 * A hand-authored diamond silhouette gates where pixels may appear; hash bits
 * decide which masked cells light up, mirrored across the vertical axis. The
 * mask guarantees a recognizable badge-like outline for every seed. FROZEN.
 *
 * Mask = Manhattan diamond: |x - 4| + |y - 4| <= 4.
 */
function inMask(x: number, y: number): boolean {
  const mid = (GRID_SIZE - 1) / 2; // 4
  return Math.abs(x - mid) + Math.abs(y - mid) <= mid;
}

export const symmetricMaskV1: GlyphGrammar = {
  id: 'symmetric-mask-v1',
  label: 'Symmetric Mask',
  description: 'Hash bits gated by a diamond mask — always a clean badge silhouette.',
  materialId: 'hashglyph-symmetric-mask-v1',
  byteBudget: 4, // <= 25 masked cells in the left half
  build({ bits }) {
    const grid = emptyGrid();
    const mid = (GRID_SIZE - 1) / 2; // 4
    for (let x = 0; x <= mid; x += 1) {
      for (let y = 0; y < GRID_SIZE; y += 1) {
        if (!inMask(x, y)) continue;
        const on = bits.bool() ? 1 : 0;
        setCell(grid, x, y, on);
        setCell(grid, GRID_SIZE - 1 - x, y, on);
      }
    }
    return { grid, decisions: [] };
  },
};
