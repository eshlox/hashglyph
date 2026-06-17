import { GRID_SIZE } from './version.js';

/** A single pixel: 1 = foreground (on), 0 = background (off). */
export type Cell = 0 | 1;

/** A square pixel grid indexed `grid[y][x]` (row-major), values in {0,1}. */
export type Grid = Cell[][];

/** Allocate an all-off square grid. */
export function emptyGrid(size: number = GRID_SIZE): Grid {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => 0 as Cell));
}

/** True when `(x, y)` lies inside `grid`. */
export function inBounds(grid: Grid, x: number, y: number): boolean {
  return y >= 0 && y < grid.length && x >= 0 && x < (grid[y]?.length ?? 0);
}

/** Read a cell, returning 0 for out-of-bounds coordinates. */
export function getCell(grid: Grid, x: number, y: number): Cell {
  return grid[y]?.[x] ?? 0;
}

/** Set a cell if `(x, y)` is in bounds; out-of-bounds writes are ignored. */
export function setCell(grid: Grid, x: number, y: number, value: Cell): void {
  const row = grid[y];
  if (row && x >= 0 && x < row.length) {
    row[x] = value;
  }
}

/** Count the number of on-cells. */
export function countOn(grid: Grid): number {
  let total = 0;
  for (const row of grid) {
    for (const cell of row) {
      total += cell;
    }
  }
  return total;
}

/** Render the grid as monospaced ASCII (handy for terminals and tests). */
export function gridToAscii(grid: Grid, on = '█', off = '·'): string {
  return grid.map((row) => row.map((cell) => (cell ? on : off)).join('')).join('\n');
}
