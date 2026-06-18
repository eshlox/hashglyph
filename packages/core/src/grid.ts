/** A single cell: a palette index. 0 is the background (unpainted); 1+ are painted. */
export type Cell = number;

/** A square grid of palette indices indexed `grid[y][x]` (row-major). */
export type Grid = Cell[][];

/** Allocate an all-background (index 0) square grid of `size` cells per edge. */
export function emptyGrid(size: number): Grid {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => 0 as Cell));
}

/** True when `(x, y)` lies inside `grid`. */
export function inBounds(grid: Grid, x: number, y: number): boolean {
  return y >= 0 && y < grid.length && x >= 0 && x < (grid[y]?.length ?? 0);
}

/** Read a cell, returning 0 (background) for out-of-bounds coordinates. */
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

/** Count the painted (non-background) cells. */
export function countOn(grid: Grid): number {
  let total = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell) total += 1;
    }
  }
  return total;
}

/** Render the grid's painted silhouette as monospaced ASCII (handy for terminals and tests). */
export function gridToAscii(grid: Grid, on = '█', off = '·'): string {
  return grid.map((row) => row.map((cell) => (cell ? on : off)).join('')).join('\n');
}
