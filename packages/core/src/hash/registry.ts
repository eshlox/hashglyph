import { blake3 } from '@noble/hashes/blake3.js';
import { sha256, sha512 } from '@noble/hashes/sha2.js';
import { keccak_256, sha3_256, sha3_512 } from '@noble/hashes/sha3.js';
import { utf8ToBytes } from '@noble/hashes/utils.js';
import { UnknownAlgorithmError } from '../errors.js';

/** Identifier of a supported hash function. */
export type HashId = 'blake3' | 'sha256' | 'sha512' | 'sha3-256' | 'sha3-512' | 'keccak256';

/** The default hash. BLAKE3 produces the canonical `eshlox` mark. */
export const DEFAULT_HASH: HashId = 'blake3';

/** A hash function exposed as a deterministic byte source. */
export interface HashProvider {
  readonly id: HashId;
  /** Human-friendly name for UIs. */
  readonly label: string;
  /** One-line description. */
  readonly description: string;
  /**
   * Deterministically derive exactly `length` bytes from `material`.
   *
   * BLAKE3 uses its native extendable output (XOF). Fixed-length hashes use an
   * HKDF-style counter expansion: `prk = H(material)`, then
   * `H(prk ‖ u32be(0)) ‖ H(prk ‖ u32be(1)) ‖ …` truncated to `length`.
   */
  expand(material: string, length: number): Uint8Array;
}

type FixedHash = (input: Uint8Array) => Uint8Array;

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
  description: string,
  hash: FixedHash,
): HashProvider {
  return {
    id,
    label,
    description,
    expand: (material, length) => counterExpand(hash, material, length),
  };
}

const PROVIDERS: Record<HashId, HashProvider> = {
  blake3: {
    id: 'blake3',
    label: 'BLAKE3',
    description: 'Modern XOF hash. Fast, extendable, and the canonical default.',
    expand: (material, length) => blake3(utf8ToBytes(material), { dkLen: length }),
  },
  sha256: fixedProvider(
    'sha256',
    'SHA-256',
    'NIST FIPS 180-4 standard. Counter-expanded to fill the bit budget.',
    sha256,
  ),
  sha512: fixedProvider(
    'sha512',
    'SHA-512',
    'Wider SHA-2 variant. Counter-expanded for arbitrary output length.',
    sha512,
  ),
  'sha3-256': fixedProvider(
    'sha3-256',
    'SHA3-256',
    'Keccak-based NIST FIPS 202 standard.',
    sha3_256,
  ),
  'sha3-512': fixedProvider('sha3-512', 'SHA3-512', 'Wider SHA-3 variant.', sha3_512),
  keccak256: fixedProvider(
    'keccak256',
    'Keccak-256',
    'Original Keccak padding (as used by Ethereum).',
    keccak_256,
  ),
};

/** All hash ids in display order. */
export const HASH_IDS: readonly HashId[] = [
  'blake3',
  'sha256',
  'sha512',
  'sha3-256',
  'sha3-512',
  'keccak256',
];

/** All hash providers in display order. */
export const HASHES: readonly HashProvider[] = HASH_IDS.map((id) => PROVIDERS[id]);

/** True when `id` is a known hash id. */
export function isHashId(id: string): id is HashId {
  return Object.hasOwn(PROVIDERS, id);
}

/** Look up a hash provider. @throws {UnknownAlgorithmError} for unknown ids. */
export function getHash(id: HashId): HashProvider {
  const provider = PROVIDERS[id];
  if (!provider) {
    throw new UnknownAlgorithmError('hash', id, HASH_IDS);
  }
  return provider;
}
