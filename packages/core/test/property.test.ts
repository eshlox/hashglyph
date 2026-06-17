import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  escapeXml,
  GRAMMAR_IDS,
  GRID_SIZE,
  generateGlyph,
  gridToAscii,
  HASH_IDS,
  renderSvg,
} from '../src/index.js';

// Seeds that always normalize to something non-empty.
const seedArb = fc.string({ minLength: 1, maxLength: 40 }).filter((s) => s.trim().length > 0);
const hashArb = fc.constantFrom(...HASH_IDS);
const grammarArb = fc.constantFrom(...GRAMMAR_IDS);

describe('property: generateGlyph invariants for all inputs', () => {
  it('always yields a 9×9 grid of {0,1}', () => {
    fc.assert(
      fc.property(seedArb, hashArb, grammarArb, (seed, hash, grammar) => {
        const { grid } = generateGlyph({ seed, hash, grammar });
        expect(grid).toHaveLength(GRID_SIZE);
        for (const row of grid) {
          expect(row).toHaveLength(GRID_SIZE);
          for (const cell of row) {
            expect(cell === 0 || cell === 1).toBe(true);
          }
        }
      }),
      { numRuns: 300 },
    );
  });

  it('is a pure function (same input → identical output)', () => {
    fc.assert(
      fc.property(seedArb, hashArb, grammarArb, (seed, hash, grammar) => {
        const a = generateGlyph({ seed, hash, grammar });
        const b = generateGlyph({ seed, hash, grammar });
        expect(gridToAscii(a.grid)).toBe(gridToAscii(b.grid));
        expect(a.digestHex).toBe(b.digestHex);
      }),
      { numRuns: 200 },
    );
  });

  it('renders SVG that escapes the seed and always parses', () => {
    fc.assert(
      fc.property(seedArb, (seed) => {
        const svg = renderSvg(generateGlyph({ seed }));
        expect(svg).not.toMatch(/<script/i);
        expect((svg.match(/<svg/g) ?? []).length).toBe(1);
        // The seed only ever appears in its fully escaped <title> form.
        expect(svg).toContain(`<title>${escapeXml(`HashGlyph — ${seed}`)}</title>`);
      }),
      { numRuns: 300 },
    );
  });
});
