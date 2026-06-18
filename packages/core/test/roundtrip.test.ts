import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { decodeGlyphHex, generateGlyph, HASH_IDS, STYLE_IDS, verifyGlyph } from '../src/index.js';

const seedArb = fc.string({ minLength: 1, maxLength: 40 }).filter((s) => s.trim().length > 0);
const hashArb = fc.constantFrom(...HASH_IDS);
const styleArb = fc.constantFrom(...STYLE_IDS);

describe('decode / verify round-trip', () => {
  it('a glyph decodes back to its own digest', () => {
    fc.assert(
      fc.property(seedArb, hashArb, styleArb, (seed, hash, style) => {
        const glyph = generateGlyph({ seed, hash, style });
        expect(decodeGlyphHex(glyph.grid, style)).toBe(glyph.digestHex);
      }),
      { numRuns: 300 },
    );
  });

  it('verify accepts the true (seed, hash) and the style is irrelevant to identity', () => {
    fc.assert(
      fc.property(seedArb, hashArb, styleArb, (seed, hash, style) => {
        const glyph = generateGlyph({ seed, hash, style });
        expect(verifyGlyph(glyph.grid, style, seed, hash)).toBe(true);
        // Case/whitespace variants normalize to the same seed and still verify.
        expect(verifyGlyph(glyph.grid, style, ` ${seed} `, hash)).toBe(true);
      }),
      { numRuns: 200 },
    );
  });

  it('verify rejects the wrong seed or the wrong hash', () => {
    const glyph = generateGlyph({ seed: 'acme', hash: 'blake3', style: 'mono-16' });
    expect(verifyGlyph(glyph.grid, 'mono-16', 'acme', 'blake3')).toBe(true);
    expect(verifyGlyph(glyph.grid, 'mono-16', 'acme corp', 'blake3')).toBe(false);
    expect(verifyGlyph(glyph.grid, 'mono-16', 'acme', 'sha256')).toBe(false);
  });

  it('verify rejects a grid of the wrong style/size', () => {
    const color = generateGlyph({ seed: 'acme', style: 'color-8' });
    // An 8×8 grid cannot be a mono-16 glyph.
    expect(verifyGlyph(color.grid, 'mono-16', 'acme', 'blake3')).toBe(false);
  });
});
