import { describe, expect, it } from 'vitest';
import { getHash, HASH_IDS, HASHES, isHashId, UnknownAlgorithmError } from '../src/index.js';

describe('hash registry', () => {
  it('exposes all expected hashes', () => {
    expect(HASH_IDS).toEqual(['blake3', 'sha256', 'sha512', 'sha3-256', 'sha3-512', 'keccak256']);
    expect(HASHES).toHaveLength(HASH_IDS.length);
  });

  it('isHashId narrows known/unknown ids', () => {
    expect(isHashId('blake3')).toBe(true);
    expect(isHashId('md5')).toBe(false);
  });

  it('throws UnknownAlgorithmError for unknown ids', () => {
    // @ts-expect-error testing the runtime guard with an invalid id
    expect(() => getHash('md5')).toThrow(UnknownAlgorithmError);
  });

  describe('expand()', () => {
    for (const id of HASH_IDS) {
      it(`${id} is deterministic and produces the exact requested length`, () => {
        const provider = getHash(id);
        const a = provider.expand('hashglyph|test', 64);
        const b = provider.expand('hashglyph|test', 64);
        expect(a).toEqual(b);
        expect(a).toHaveLength(64);
        // A longer request is a strict superset prefix only for true XOFs; for
        // counter-mode it just needs to be deterministic + correct length.
        expect(provider.expand('hashglyph|test', 200)).toHaveLength(200);
      });

      it(`${id} diverges for different material`, () => {
        const provider = getHash(id);
        expect(provider.expand('a', 32)).not.toEqual(provider.expand('b', 32));
      });
    }

    it('blake3 expansion is a true XOF (prefix-stable)', () => {
      const blake = getHash('blake3');
      const short = blake.expand('hashglyph|test', 32);
      const long = blake.expand('hashglyph|test', 64);
      expect(long.slice(0, 32)).toEqual(short);
    });

    it('blake3 reproduces the canonical 64-byte digest', () => {
      const blake = getHash('blake3');
      const hex = Buffer.from(blake.expand('hashglyph-core-accents-v1|hashglyph', 64)).toString(
        'hex',
      );
      expect(hex.startsWith('bfd24b02875f3d34')).toBe(true);
    });
  });
});
