import type { Palette } from './types.js';

/**
 * Monochrome palette: index 0 background, index 1 the painted ink. The ink can be
 * overridden at render time via the `fg` option; the background via `bg`.
 */
export const MONO_PALETTE: Palette = [null, '#000000'];

/**
 * Fixed 16-entry palette for the color style. Index 0 is background (unpainted);
 * indices 1–15 are evenly spaced, vivid hues so the mark reads as a mosaic.
 *
 * FROZEN: the index → color mapping is part of the decode contract. Changing any
 * entry changes every color glyph and breaks `decode`.
 */
export const COLOR_PALETTE: Palette = [
  null, // 0 background
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#10b981',
  '#14b8a6',
  '#06b6d4',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#ec4899',
  '#f43f5e',
];
