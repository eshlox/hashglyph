import { describe, expect, it } from 'vitest';
import { generateGlyph, getStyle, gridToAscii, HASH_IDS, STYLE_IDS } from '../src/index.js';

describe('determinism across every (hash × style) combo', () => {
  for (const hash of HASH_IDS) {
    for (const style of STYLE_IDS) {
      it(`${hash} × ${style} is stable and well-formed`, () => {
        const a = generateGlyph({ seed: 'hashglyph', hash, style });
        const b = generateGlyph({ seed: 'hashglyph', hash, style });

        // Same input → identical output.
        expect(gridToAscii(b.grid)).toBe(gridToAscii(a.grid));
        expect(b.digestHex).toBe(a.digestHex);

        // Grid matches the style's dimensions, with cell values in palette range.
        const { size, bitsPerCell } = getStyle(style);
        expect(a.grid).toHaveLength(size);
        for (const row of a.grid) {
          expect(row).toHaveLength(size);
          for (const cell of row) {
            expect(cell).toBeGreaterThanOrEqual(0);
            expect(cell).toBeLessThan(1 << bitsPerCell);
          }
        }

        // 32-byte digest → 64 hex chars.
        expect(a.digestHex).toMatch(/^[0-9a-f]{64}$/);
      });
    }
  }

  it('the digest depends on (hash, seed) only, not the style', () => {
    const mono = generateGlyph({ seed: 'hashglyph', hash: 'blake3', style: 'mono-16' });
    const color = generateGlyph({ seed: 'hashglyph', hash: 'blake3', style: 'color-8' });
    expect(color.digestHex).toBe(mono.digestHex);

    const sha = generateGlyph({ seed: 'hashglyph', hash: 'sha256' });
    expect(sha.material).toBe(mono.material);
    expect(sha.digestHex).not.toBe(mono.digestHex);
  });

  it('full digest snapshot for every combo (regression guard)', () => {
    const table: Record<string, string> = {};
    for (const hash of HASH_IDS) {
      for (const style of STYLE_IDS) {
        const g = generateGlyph({ seed: 'hashglyph', hash, style });
        table[`${hash}|${style}`] = g.digestHex;
      }
    }
    expect(table).toMatchSnapshot();
  });
});
