import { describe, expect, it } from 'vitest';
import { GRAMMAR_IDS, GRID_SIZE, generateGlyph, gridToAscii, HASH_IDS } from '../src/index.js';

describe('determinism across every (hash × grammar) combo', () => {
  for (const hash of HASH_IDS) {
    for (const grammar of GRAMMAR_IDS) {
      it(`${hash} × ${grammar} is stable and well-formed`, () => {
        const a = generateGlyph({ seed: 'hashglyph', hash, grammar });
        const b = generateGlyph({ seed: 'hashglyph', hash, grammar });

        // Same input → identical output.
        expect(gridToAscii(b.grid)).toBe(gridToAscii(a.grid));
        expect(b.digestHex).toBe(a.digestHex);

        // Grid is exactly 9×9 of {0,1}.
        expect(a.grid).toHaveLength(GRID_SIZE);
        for (const row of a.grid) {
          expect(row).toHaveLength(GRID_SIZE);
          for (const cell of row) {
            expect(cell === 0 || cell === 1).toBe(true);
          }
        }

        // 64-byte digest → 128 hex chars.
        expect(a.digestHex).toMatch(/^[0-9a-f]{128}$/);
      });
    }
  }

  it('different hashes diverge for non-canonical material but share the grammar core', () => {
    const blake = generateGlyph({ seed: 'hashglyph', hash: 'blake3' });
    const sha = generateGlyph({ seed: 'hashglyph', hash: 'sha256' });
    // Same grammar id and material id (hash name is not part of the material).
    expect(sha.materialId).toBe(blake.materialId);
    // ...but a different hash yields a different digest.
    expect(sha.digestHex).not.toBe(blake.digestHex);
  });

  it('full digest snapshot for every combo (regression guard)', () => {
    const table: Record<string, string> = {};
    for (const hash of HASH_IDS) {
      for (const grammar of GRAMMAR_IDS) {
        const g = generateGlyph({ seed: 'hashglyph', hash, grammar });
        table[`${hash}|${grammar}`] =
          `${g.digestHex.slice(0, 16)} ${gridToAscii(g.grid).replace(/\n/g, '/')}`;
      }
    }
    expect(table).toMatchSnapshot();
  });
});
