import { describe, expect, it } from 'vitest';
import { generateGlyph, gridToAscii, renderSvg } from '../src/index.js';

/**
 * The frozen contract. If any of these change, the official eshlox logo has
 * changed — which must never happen silently. Treat a failure here as a
 * release-blocking regression, not a snapshot to update.
 */

const CANONICAL_DIGEST =
  '4b343318ccb00312918f026859a895c7cba8de501c4dd05281e9244998b160c0' +
  'efd87842589ba89f98f772030b83780a247e4528c738ecdfa837cc705d600440';

const CANONICAL_GRID = [
  '·········',
  '·███████·',
  '·██···██·',
  '·█·███·█·',
  '·██·████·',
  '·█·███·█·',
  '·██···██·',
  '·███████·',
  '·········',
].join('\n');

const CANONICAL_DECISIONS = [
  { x: 4, y: 1, enabled: false },
  { x: 1, y: 4, enabled: true },
  { x: 7, y: 4, enabled: false },
  { x: 4, y: 7, enabled: false },
  { x: 4, y: 3, enabled: true },
  { x: 3, y: 4, enabled: false },
  { x: 5, y: 4, enabled: true },
  { x: 4, y: 5, enabled: true },
];

describe('canonical eshlox glyph (FROZEN)', () => {
  const glyph = generateGlyph({ seed: 'eshlox' });

  it('uses the canonical material', () => {
    expect(glyph.material).toBe('eshlox-deterministic-glyph-v1|eshlox');
    expect(glyph.hashId).toBe('blake3');
    expect(glyph.grammarId).toBe('core-accents-v1');
  });

  it('produces the exact 64-byte BLAKE3 digest', () => {
    expect(glyph.digestHex).toBe(CANONICAL_DIGEST);
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
    for (const variant of ['Eshlox', ' eshlox ', 'ESHLOX', '\tEshlox\n']) {
      const other = generateGlyph({ seed: variant });
      expect(other.digestHex).toBe(CANONICAL_DIGEST);
      expect(gridToAscii(other.grid)).toBe(CANONICAL_GRID);
    }
  });
});
