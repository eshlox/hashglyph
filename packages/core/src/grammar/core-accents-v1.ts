import { emptyGrid, setCell } from '../grid.js';
import type { AccentDecision, GlyphGrammar, Point } from './types.js';

/**
 * The canonical HashGlyph grammar.
 *
 * A fixed square shell plus an internal X / portal motif give the mark its
 * stable identity; eight hash-driven accent pixels add the "generated digital
 * signature" feel without ever destroying the core shape.
 *
 * FROZEN. This is the default grammar for every seed. Combined with BLAKE3 over
 * `hashglyph-core-accents-v1|hashglyph` it reproduces the project's own logo,
 * byte for byte, forever.
 */

/** Fixed inner motif: portal / compressed-letter structure. */
const CORE_MOTIF: readonly Point[] = [
  [2, 2],
  [3, 3],
  [5, 3],
  [6, 2],
  [2, 6],
  [3, 5],
  [5, 5],
  [6, 6],
  [2, 4],
  [4, 4],
  [6, 4],
];

/** Hash-controlled accent positions, consumed in this exact order (MSB-first). */
const ACCENTS: readonly Point[] = [
  [4, 1],
  [1, 4],
  [7, 4],
  [4, 7],
  [4, 3],
  [3, 4],
  [5, 4],
  [4, 5],
];

export const coreAccentsV1: GlyphGrammar = {
  id: 'core-accents-v1',
  label: 'Core + Accents',
  description: 'The canonical mark: a fixed shell + portal motif with hashed accents.',
  materialId: 'hashglyph-core-accents-v1',
  byteBudget: 1,
  build({ bits }) {
    const grid = emptyGrid();

    // 1. Fixed brand core: a square shell.
    for (let x = 1; x <= 7; x += 1) {
      setCell(grid, x, 1, 1);
      setCell(grid, x, 7, 1);
    }
    for (let y = 2; y <= 6; y += 1) {
      setCell(grid, 1, y, 1);
      setCell(grid, 7, y, 1);
    }

    // 2. Fixed inner motif.
    for (const [x, y] of CORE_MOTIF) {
      setCell(grid, x, y, 1);
    }

    // 3. Deterministic accents from the hash bits.
    const decisions: AccentDecision[] = [];
    for (const [x, y] of ACCENTS) {
      const enabled = bits.bool();
      decisions.push({ x, y, enabled });
      if (enabled) {
        setCell(grid, x, y, 1);
      }
    }

    return { grid, decisions };
  },
};
