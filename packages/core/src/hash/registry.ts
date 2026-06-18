import { blake2b, blake2s } from '@noble/hashes/blake2.js';
import { blake3 } from '@noble/hashes/blake3.js';
import { md5, ripemd160, sha1 } from '@noble/hashes/legacy.js';
import { sha224, sha256, sha384, sha512, sha512_256 } from '@noble/hashes/sha2.js';
import {
  keccak_256,
  keccak_512,
  sha3_256,
  sha3_512,
  shake128,
  shake256,
} from '@noble/hashes/sha3.js';
import { utf8ToBytes } from '@noble/hashes/utils.js';
import { UnknownAlgorithmError } from '../errors.js';

/** Identifier of a supported hash function. */
export type HashId =
  | 'blake3'
  | 'blake2b'
  | 'blake2s'
  | 'sha256'
  | 'sha224'
  | 'sha384'
  | 'sha512'
  | 'sha512-256'
  | 'sha3-256'
  | 'sha3-512'
  | 'shake128'
  | 'shake256'
  | 'keccak256'
  | 'keccak512'
  | 'ripemd160'
  | 'sha1'
  | 'md5';

/**
 * Collision-resistance honesty tier for a hash, given a 256-bit glyph:
 *
 * - `strong`: ≥256-bit, modern. Two seeds sharing a glyph is infeasible (~2^128).
 * - `reduced`: native digest is under 256 bits, so the glyph's real entropy is
 *   capped below the canvas. Not broken, but a smaller safety margin.
 * - `broken`: collisions can be constructed deliberately, so two different
 *   strings can be forced to the same glyph. Fun only; never trusted for uniqueness.
 */
export type HashTier = 'strong' | 'reduced' | 'broken';

/** The default hash. BLAKE3 produces the canonical mark for any seed. */
export const DEFAULT_HASH: HashId = 'blake3';

/** A hash function exposed as a deterministic byte source. */
export interface HashProvider {
  readonly id: HashId;
  /** Human-friendly name for UIs. */
  readonly label: string;
  /** One-line description. */
  readonly description: string;
  /** Collision-resistance tier for the uniqueness guarantee. */
  readonly tier: HashTier;
  /**
   * Deterministically derive exactly `length` bytes from `material`.
   *
   * Extendable-output functions (BLAKE3, SHAKE) use their native XOF. Fixed-length
   * hashes use an HKDF-style counter expansion: `prk = H(material)`, then
   * `H(prk ‖ u32be(0)) ‖ H(prk ‖ u32be(1)) ‖ …` truncated to `length`. Expansion
   * never adds entropy: a hash's real strength stays its native digest width.
   */
  expand(material: string, length: number): Uint8Array;
}

type FixedHash = (input: Uint8Array) => Uint8Array;
type Xof = (input: Uint8Array, opts: { dkLen: number }) => Uint8Array;

function u32be(n: number): Uint8Array {
  const out = new Uint8Array(4);
  out[0] = (n >>> 24) & 0xff;
  out[1] = (n >>> 16) & 0xff;
  out[2] = (n >>> 8) & 0xff;
  out[3] = n & 0xff;
  return out;
}

/** Counter-mode expansion shared by all fixed-length hashes. */
function counterExpand(hash: FixedHash, material: string, length: number): Uint8Array {
  if (length < 0) {
    throw new RangeError(`expand(length): length must be >= 0, got ${length}.`);
  }
  const prk = hash(utf8ToBytes(material));
  const block = new Uint8Array(prk.length + 4);
  block.set(prk, 0);
  const out = new Uint8Array(length);
  let offset = 0;
  let counter = 0;
  while (offset < length) {
    block.set(u32be(counter), prk.length);
    const chunk = hash(block);
    const take = Math.min(chunk.length, length - offset);
    out.set(chunk.subarray(0, take), offset);
    offset += take;
    counter += 1;
  }
  return out;
}

function fixedProvider(
  id: HashId,
  label: string,
  tier: HashTier,
  description: string,
  hash: FixedHash,
): HashProvider {
  return {
    id,
    label,
    tier,
    description,
    expand: (material, length) => counterExpand(hash, material, length),
  };
}

/** Provider for native extendable-output functions (XOFs): no counter expansion needed. */
function xofProvider(
  id: HashId,
  label: string,
  tier: HashTier,
  description: string,
  xof: Xof,
): HashProvider {
  return {
    id,
    label,
    tier,
    description,
    expand: (material, length) => {
      if (length < 0) {
        throw new RangeError(`expand(length): length must be >= 0, got ${length}.`);
      }
      return xof(utf8ToBytes(material), { dkLen: length });
    },
  };
}

const PROVIDERS: Record<HashId, HashProvider> = {
  // --- XOFs: native arbitrary-length output ---
  blake3: xofProvider(
    'blake3',
    'BLAKE3',
    'strong',
    'Modern XOF hash. Fast, extendable, and the canonical default.',
    blake3,
  ),
  shake128: xofProvider(
    'shake128',
    'SHAKE128',
    'strong',
    'SHA-3 extendable-output function (NIST FIPS 202).',
    shake128,
  ),
  shake256: xofProvider(
    'shake256',
    'SHAKE256',
    'strong',
    'Wider SHA-3 XOF with a larger security margin.',
    shake256,
  ),
  // --- BLAKE2: fast, used by Zcash, libsodium, and Argon2 ---
  blake2b: fixedProvider(
    'blake2b',
    'BLAKE2b',
    'strong',
    '64-bit-optimized BLAKE2. Used by Zcash, libsodium, and Argon2.',
    blake2b,
  ),
  blake2s: fixedProvider(
    'blake2s',
    'BLAKE2s',
    'strong',
    '32-bit-optimized BLAKE2 for smaller architectures.',
    blake2s,
  ),
  // --- SHA-2 family (NIST FIPS 180-4) ---
  sha256: fixedProvider(
    'sha256',
    'SHA-256',
    'strong',
    'NIST FIPS 180-4 standard. 256-bit, the workhorse hash.',
    sha256,
  ),
  sha224: fixedProvider(
    'sha224',
    'SHA-224',
    'reduced',
    'Truncated SHA-2 variant: only 224 native bits, so a smaller margin.',
    sha224,
  ),
  sha384: fixedProvider(
    'sha384',
    'SHA-384',
    'strong',
    'Truncated SHA-512 variant, 384 native bits.',
    sha384,
  ),
  sha512: fixedProvider(
    'sha512',
    'SHA-512',
    'strong',
    'Wider SHA-2 variant. Fast on 64-bit CPUs.',
    sha512,
  ),
  'sha512-256': fixedProvider(
    'sha512-256',
    'SHA-512/256',
    'strong',
    'SHA-512 truncated to 256 bits (faster than SHA-256 on 64-bit CPUs).',
    sha512_256,
  ),
  // --- SHA-3 / Keccak (NIST FIPS 202) ---
  'sha3-256': fixedProvider(
    'sha3-256',
    'SHA3-256',
    'strong',
    'Keccak-based NIST FIPS 202 standard.',
    sha3_256,
  ),
  'sha3-512': fixedProvider('sha3-512', 'SHA3-512', 'strong', 'Wider SHA-3 variant.', sha3_512),
  keccak256: fixedProvider(
    'keccak256',
    'Keccak-256',
    'strong',
    'Original Keccak padding (as used by Ethereum).',
    keccak_256,
  ),
  keccak512: fixedProvider(
    'keccak512',
    'Keccak-512',
    'strong',
    'Wider original-padding Keccak.',
    keccak_512,
  ),
  // --- Legacy / shorter digests ---
  ripemd160: fixedProvider(
    'ripemd160',
    'RIPEMD-160',
    'reduced',
    '160-bit hash behind Bitcoin and Ethereum addresses. Small margin, not broken.',
    ripemd160,
  ),
  sha1: fixedProvider(
    'sha1',
    'SHA-1',
    'broken',
    'Legacy 160-bit hash. Collisions are demonstrable; not collision-safe.',
    sha1,
  ),
  md5: fixedProvider(
    'md5',
    'MD5',
    'broken',
    'Legacy 128-bit hash. Collisions are trivial to construct; for fun only.',
    md5,
  ),
};

/** All hash ids in display order. */
export const HASH_IDS: readonly HashId[] = [
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
];

/** All hash providers in display order. */
export const HASHES: readonly HashProvider[] = HASH_IDS.map((id) => PROVIDERS[id]);

/** True when `id` is a known hash id. */
export function isHashId(id: string): id is HashId {
  return Object.hasOwn(PROVIDERS, id);
}

/** Look up a hash provider. @throws {UnknownAlgorithmError} for an unknown id. */
export function getHash(id: HashId): HashProvider {
  const provider = PROVIDERS[id];
  if (!provider) {
    throw new UnknownAlgorithmError('hash', id, HASH_IDS);
  }
  return provider;
}
