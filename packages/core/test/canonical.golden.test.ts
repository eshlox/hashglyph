import { describe, expect, it } from 'vitest';
import {
  decodeGlyphHex,
  generateGlyph,
  gridToAscii,
  renderSvg,
  verifyGlyph,
} from '../src/index.js';

/**
 * The frozen contract. The default style (`mono-16`) + BLAKE3 must forever map a
 * seed to the same mark. We pin the glyph for the seed `hashglyph` as the
 * canonical regression guard. Treat a failure here as a release-blocking break of
 * the determinism promise, not a snapshot to update.
 */

const CANONICAL_DIGEST = '70d824582c9c3e3560c255cbba79e7ead272920df7054db08c68ee58fcfd60e7';

const CANONICAL_GRID = [
  '·███····██·██···',
  '··█··█···█·██···',
  '··█·██··█··███··',
  '··█████···██·█·█',
  '·██·····██····█·',
  '·█·█·█·███··█·██',
  '█·███·█··████··█',
  '███··██████·█·█·',
  '██·█··█··███··█·',
  '█··█··█·····██·█',
  '████·███·····█·█',
  '·█··██·██·██····',
  '█···██···██·█···',
  '███·███··█·██···',
  '██████··██████·█',
  '·██·····███··███',
].join('\n');

describe('canonical HashGlyph mark (FROZEN)', () => {
  const glyph = generateGlyph({ seed: 'hashglyph' });

  it('uses the canonical material and defaults', () => {
    expect(glyph.material).toBe('hashglyph-v2|hashglyph');
    expect(glyph.hashId).toBe('blake3');
    expect(glyph.styleId).toBe('mono-16');
  });

  it('produces the exact 32-byte BLAKE3 digest', () => {
    expect(glyph.digestHex).toBe(CANONICAL_DIGEST);
  });

  it('produces the exact 16×16 grid', () => {
    expect(gridToAscii(glyph.grid)).toBe(CANONICAL_GRID);
  });

  it('decodes losslessly back to its digest and self-verifies', () => {
    expect(decodeGlyphHex(glyph.grid, 'mono-16')).toBe(CANONICAL_DIGEST);
    expect(verifyGlyph(glyph.grid, 'mono-16', 'hashglyph', 'blake3')).toBe(true);
  });

  it('renders a byte-stable canonical SVG', () => {
    expect(renderSvg(glyph)).toMatchSnapshot();
  });

  it('is reproduced for case/whitespace variants of the seed', () => {
    for (const variant of ['HashGlyph', ' hashglyph ', 'HASHGLYPH', '\tHashGlyph\n']) {
      const other = generateGlyph({ seed: variant });
      expect(other.digestHex).toBe(CANONICAL_DIGEST);
      expect(gridToAscii(other.grid)).toBe(CANONICAL_GRID);
    }
  });
});
