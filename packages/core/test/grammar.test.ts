import { describe, expect, it } from 'vitest';
import {
  countOn,
  GRAMMAR_IDS,
  GRAMMARS,
  generateGlyph,
  getGrammar,
  isGrammarId,
  UnknownAlgorithmError,
} from '../src/index.js';

describe('grammar registry', () => {
  it('exposes all expected grammars with unique frozen material ids', () => {
    expect(GRAMMAR_IDS).toEqual([
      'core-accents-v1',
      'mirror-identicon-v1',
      'symmetric-mask-v1',
      'quad-fold-v1',
      'cellular-automata-v1',
    ]);
    const materialIds = GRAMMARS.map((g) => g.materialId);
    expect(new Set(materialIds).size).toBe(materialIds.length);
  });

  it('isGrammarId narrows known/unknown ids', () => {
    expect(isGrammarId('core-accents-v1')).toBe(true);
    expect(isGrammarId('nope')).toBe(false);
  });

  it('throws UnknownAlgorithmError for unknown ids', () => {
    // @ts-expect-error testing the runtime guard
    expect(() => getGrammar('nope')).toThrow(UnknownAlgorithmError);
  });

  it('every grammar produces a non-empty glyph for the eshlox seed', () => {
    for (const id of GRAMMAR_IDS) {
      const glyph = generateGlyph({ seed: 'eshlox', grammar: id });
      expect(countOn(glyph.grid)).toBeGreaterThan(0);
    }
  });

  it('symmetric grammars are vertically mirrored', () => {
    for (const id of ['mirror-identicon-v1', 'symmetric-mask-v1', 'quad-fold-v1'] as const) {
      const { grid } = generateGlyph({ seed: 'mirror-check', grammar: id });
      for (const row of grid) {
        for (let x = 0; x < row.length; x += 1) {
          expect(row[x]).toBe(row[row.length - 1 - x]);
        }
      }
    }
  });

  it('quad-fold is also horizontally mirrored (4-fold)', () => {
    const { grid } = generateGlyph({ seed: 'quad-check', grammar: 'quad-fold-v1' });
    const h = grid.length;
    for (let y = 0; y < h; y += 1) {
      expect(grid[y]).toEqual(grid[h - 1 - y]);
    }
  });

  it('core-accents always keeps the fixed shell (corners of the inner square)', () => {
    // The shell pixel at (1,1) is fixed regardless of accents/seed/hash.
    for (const seed of ['eshlox', 'a', 'something-else', '🚀']) {
      const { grid } = generateGlyph({ seed, grammar: 'core-accents-v1' });
      expect(grid[1]?.[1]).toBe(1);
      expect(grid[7]?.[7]).toBe(1);
    }
  });
});
