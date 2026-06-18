import { describe, expect, it } from 'vitest';
import { getHash, HASH_IDS, HASHES, isHashId, UnknownAlgorithmError } from '../src/index.js';

describe('hash registry', () => {
  it('labels every hash with a collision-resistance tier', () => {
    const tiers = Object.fromEntries(HASHES.map((h) => [h.id, h.tier]));
    expect(tiers.blake3).toBe('strong');
    expect(tiers.sha256).toBe('strong');
    expect(tiers.sha224).toBe('reduced');
    expect(tiers.ripemd160).toBe('reduced');
    expect(tiers.sha1).toBe('broken');
    expect(tiers.md5).toBe('broken');
    for (const h of HASHES) {
      expect(['strong', 'reduced', 'broken']).toContain(h.tier);
    }
  });

  it('exposes all expected hashes', () => {
    expect(HASH_IDS).toEqual([
      'blake3',
      'blake2b',
      'blake2s',
      'sha256',
      'sha224',
      'sha384',
      'sha512',
      'sha512-256',
      'sha3-256',
      'sha3-512',
      'shake128',
      'shake256',
      'keccak256',
      'keccak512',
      'ripemd160',
      'sha1',
      'md5',
    ]);
    expect(HASHES).toHaveLength(HASH_IDS.length);
  });

  it('isHashId narrows known/unknown ids', () => {
    expect(isHashId('blake3')).toBe(true);
    expect(isHashId('md5')).toBe(true);
    expect(isHashId('crc32')).toBe(false);
  });

  it('throws UnknownAlgorithmError for unknown ids', () => {
    // @ts-expect-error testing the runtime guard with an invalid id
    expect(() => getHash('crc32')).toThrow(UnknownAlgorithmError);
  });

  it('SHAKE expansion is a true XOF (prefix-stable)', () => {
    for (const id of ['shake128', 'shake256'] as const) {
      const x = getHash(id);
      expect(x.expand('hashglyph|test', 64).slice(0, 32)).toEqual(x.expand('hashglyph|test', 32));
    }
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

    it('blake3 reproduces the canonical digest for the project material', () => {
      const blake = getHash('blake3');
      const hex = Buffer.from(blake.expand('hashglyph-v2|hashglyph', 32)).toString('hex');
      expect(hex).toBe('70d824582c9c3e3560c255cbba79e7ead272920df7054db08c68ee58fcfd60e7');
    });
  });
});
