import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  escapeXml,
  generateGlyph,
  getStyle,
  gridToAscii,
  HASH_IDS,
  renderSvg,
  STYLE_IDS,
} from '../src/index.js';

// Seeds that always normalize to something non-empty.
const seedArb = fc.string({ minLength: 1, maxLength: 40 }).filter((s) => s.trim().length > 0);
const hashArb = fc.constantFrom(...HASH_IDS);
const styleArb = fc.constantFrom(...STYLE_IDS);

describe('property: generateGlyph invariants for all inputs', () => {
  it('always yields a grid matching the style with in-range cell values', () => {
    fc.assert(
      fc.property(seedArb, hashArb, styleArb, (seed, hash, style) => {
        const { grid } = generateGlyph({ seed, hash, style });
        const { size, bitsPerCell } = getStyle(style);
        expect(grid).toHaveLength(size);
        for (const row of grid) {
          expect(row).toHaveLength(size);
          for (const cell of row) {
            expect(cell).toBeGreaterThanOrEqual(0);
            expect(cell).toBeLessThan(1 << bitsPerCell);
          }
        }
      }),
      { numRuns: 300 },
    );
  });

  it('is a pure function (same input → identical output)', () => {
    fc.assert(
      fc.property(seedArb, hashArb, styleArb, (seed, hash, style) => {
        const a = generateGlyph({ seed, hash, style });
        const b = generateGlyph({ seed, hash, style });
        expect(gridToAscii(a.grid)).toBe(gridToAscii(b.grid));
        expect(a.digestHex).toBe(b.digestHex);
      }),
      { numRuns: 200 },
    );
  });

  it('renders SVG that escapes the seed and always parses', () => {
    fc.assert(
      fc.property(seedArb, styleArb, (seed, style) => {
        const svg = renderSvg(generateGlyph({ seed, style }));
        expect(svg).not.toMatch(/<script/i);
        expect((svg.match(/<svg/g) ?? []).length).toBe(1);
        // The seed only ever appears in its fully escaped <title> form.
        expect(svg).toContain(`<title>${escapeXml(`HashGlyph glyph for "${seed}"`)}</title>`);
      }),
      { numRuns: 300 },
    );
  });
});
