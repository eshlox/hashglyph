import type { Cell } from '../grid.js';
import { emptyGrid, getCell, setCell } from '../grid.js';
import { GRID_SIZE } from '../version.js';
import type { GlyphGrammar } from './types.js';

/**
 * Elementary cellular automaton (Rule 90) grown downward from a symmetric seed
 * row. Rule 90 (`cell = left XOR right`) preserves the seed's vertical mirror
 * symmetry, so output stays mark-like while feeling alive and circuit-y. The
 * centre seed pixel is forced on to guarantee a non-empty glyph. FROZEN:
 * rule = 90, boundary = 0, rows = 9, centre seeded.
 */
export const cellularAutomataV1: GlyphGrammar = {
  id: 'cellular-automata-v1',
  label: 'Cellular Automata',
  description: 'Rule-90 automaton grown from a hashed seed row — the nerdy one.',
  materialId: 'hashglyph-cellular-automata-v1',
  byteBudget: 1, // 5 seed bits (mirrored)
  build({ bits }) {
    const grid = emptyGrid();
    const mid = (GRID_SIZE - 1) / 2; // 4

    // Seed row (y = 0): 5 bits mirrored across the vertical axis.
    for (let x = 0; x <= mid; x += 1) {
      const on = bits.bool() ? 1 : 0;
      setCell(grid, x, 0, on);
      setCell(grid, GRID_SIZE - 1 - x, 0, on);
    }
    // Force the centre on so the glyph is never empty.
    setCell(grid, mid, 0, 1);

    // Grow with Rule 90: cell = left XOR right of the row above (boundary 0).
    for (let y = 1; y < GRID_SIZE; y += 1) {
      for (let x = 0; x < GRID_SIZE; x += 1) {
        const value = (getCell(grid, x - 1, y - 1) ^ getCell(grid, x + 1, y - 1)) as Cell;
        setCell(grid, x, y, value);
      }
    }

    return { grid, decisions: [] };
  },
};
