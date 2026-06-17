import { emptyGrid, setCell } from '../grid.js';
import { GRID_SIZE } from '../version.js';
import type { GlyphGrammar } from './types.js';

/**
 * Four-fold (quadrant) symmetry: fill the top-left quadrant including the
 * central cross from hash bits, then mirror horizontally and vertically. Reads
 * like an ornamental badge or kaleidoscope tile. FROZEN.
 */
export const quadFoldV1: GlyphGrammar = {
  id: 'quad-fold-v1',
  label: 'Quad Fold',
  description: 'Four-fold kaleidoscopic symmetry — ornamental and balanced.',
  materialId: 'hashglyph-quad-fold-v1',
  byteBudget: 4, // 5 * 5 = 25 quadrant cells
  build({ bits }) {
    const grid = emptyGrid();
    const mid = (GRID_SIZE - 1) / 2; // 4
    for (let x = 0; x <= mid; x += 1) {
      for (let y = 0; y <= mid; y += 1) {
        const on = bits.bool() ? 1 : 0;
        setCell(grid, x, y, on);
        setCell(grid, GRID_SIZE - 1 - x, y, on);
        setCell(grid, x, GRID_SIZE - 1 - y, on);
        setCell(grid, GRID_SIZE - 1 - x, GRID_SIZE - 1 - y, on);
      }
    }
    return { grid, decisions: [] };
  },
};
