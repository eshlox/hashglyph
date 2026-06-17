import { describe, expect, it } from 'vitest';
import { generateGlyph, gridToAscii, renderSvg } from '../src/index.js';

/**
 * The frozen contract. The default grammar (`core-accents-v1`) + BLAKE3 must
 * forever map a seed to the same mark. We pin the project's own logo — the
 * glyph for the seed `hashglyph` — as the canonical regression guard. Treat a
 * failure here as a release-blocking break of the determinism promise, not a
 * snapshot to update.
 */

const CANONICAL_DIGEST_FULL =
  'bfd24b02875f3d34cd6e99511319eb8c3933bd54563973a40dfec2c8833e27adb' +
  '89223357563a55c58265c4be59815fa7906acc5f11d7db61607fbf2f2ee0010';

const CANONICAL_GRID = [
  '·········',
  '·███████·',
  '·██···██·',
  '·█·███·█·',
  '·███████·',
  '·█·███·█·',
  '·██···██·',
  '·███████·',
  '·········',
].join('\n');

const CANONICAL_DECISIONS = [
  { x: 4, y: 1, enabled: true },
  { x: 1, y: 4, enabled: false },
  { x: 7, y: 4, enabled: true },
  { x: 4, y: 7, enabled: true },
  { x: 4, y: 3, enabled: true },
  { x: 3, y: 4, enabled: true },
  { x: 5, y: 4, enabled: true },
  { x: 4, y: 5, enabled: true },
];

describe('canonical HashGlyph mark (FROZEN)', () => {
  const glyph = generateGlyph({ seed: 'hashglyph' });

  it('uses the canonical material', () => {
    expect(glyph.material).toBe('hashglyph-core-accents-v1|hashglyph');
    expect(glyph.hashId).toBe('blake3');
    expect(glyph.grammarId).toBe('core-accents-v1');
  });

  it('produces the exact 64-byte BLAKE3 digest', () => {
    expect(glyph.digestHex).toBe(CANONICAL_DIGEST_FULL);
  });

  it('produces the exact accent decisions', () => {
    expect(glyph.decisions).toEqual(CANONICAL_DECISIONS);
  });

  it('produces the exact 9×9 grid', () => {
    expect(gridToAscii(glyph.grid)).toBe(CANONICAL_GRID);
  });

  it('renders a byte-stable canonical SVG', () => {
    expect(renderSvg(glyph)).toMatchSnapshot();
  });

  it('is reproduced for case/whitespace variants of the seed', () => {
    for (const variant of ['HashGlyph', ' hashglyph ', 'HASHGLYPH', '\tHashGlyph\n']) {
      const other = generateGlyph({ seed: variant });
      expect(other.digestHex).toBe(CANONICAL_DIGEST_FULL);
      expect(gridToAscii(other.grid)).toBe(CANONICAL_GRID);
    }
  });
});
