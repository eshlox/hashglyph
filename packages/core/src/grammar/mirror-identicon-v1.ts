import { emptyGrid, setCell } from '../grid.js';
import { GRID_SIZE } from '../version.js';
import type { GlyphGrammar } from './types.js';

/**
 * GitHub-style identicon: fill the left half column-by-column from hash bits,
 * then mirror across the vertical axis. The forced symmetry keeps every output
 * reading as a deliberate mark rather than noise. FROZEN.
 */
export const mirrorIdenticonV1: GlyphGrammar = {
  id: 'mirror-identicon-v1',
  label: 'Mirror Identicon',
  description: 'Vertically mirrored identicon, classic GitHub-style symmetry.',
  materialId: 'hashglyph-mirror-identicon-v1',
  byteBudget: 6, // ceil(5 cols * 9 rows / 8)
  build({ bits }) {
    const grid = emptyGrid();
    const mid = (GRID_SIZE - 1) / 2; // 4
    for (let x = 0; x <= mid; x += 1) {
      for (let y = 0; y < GRID_SIZE; y += 1) {
        const on = bits.bool() ? 1 : 0;
        setCell(grid, x, y, on);
        setCell(grid, GRID_SIZE - 1 - x, y, on);
      }
    }
    return { grid, decisions: [] };
  },
};
