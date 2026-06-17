import type { GrammarId, HashId } from '@eshlox/hashglyph-core';

/** A glossary entry: a plain-English line plus a link to read more from the source. */
export interface GlossaryNote {
  /** Short, jargon-free explanation. */
  blurb: string;
  /** Where to read more (official spec, project, or our own docs). */
  href: string;
  /** Short label for the link. */
  source: string;
}

const FIPS_180_4 = 'https://csrc.nist.gov/pubs/fips/180-4/upd1/final';
const FIPS_202 = 'https://csrc.nist.gov/pubs/fips/202/final';

/** One plain note per hash. Keyed by HashId so every shipped hash is covered. */
export const HASH_NOTES: Record<HashId, GlossaryNote> = {
  blake3: {
    blurb:
      'Fast modern hash that can stretch to any output length on its own. HashGlyph’s default — it mints the canonical mark.',
    href: 'https://github.com/BLAKE3-team/BLAKE3',
    source: 'BLAKE3 spec',
  },
  blake2b: {
    blurb:
      'Fast 64-bit-tuned hash. The workhorse inside Zcash, libsodium, and the Argon2 password hash.',
    href: 'https://www.blake2.net/',
    source: 'blake2.net',
  },
  blake2s: {
    blurb: 'BLAKE2 tuned for 32-bit and smaller devices. Same family as BLAKE2b, narrower state.',
    href: 'https://www.blake2.net/',
    source: 'blake2.net',
  },
  sha256: {
    blurb:
      'The SHA-2 standard that secures TLS, Bitcoin, and code signing. The default “SHA” most people mean.',
    href: FIPS_180_4,
    source: 'NIST FIPS 180-4',
  },
  sha224: {
    blurb: 'SHA-256 truncated to 224 bits. Same engine, shorter digest.',
    href: FIPS_180_4,
    source: 'NIST FIPS 180-4',
  },
  sha384: {
    blurb: 'SHA-512 truncated to 384 bits. Common in TLS certificates.',
    href: FIPS_180_4,
    source: 'NIST FIPS 180-4',
  },
  sha512: {
    blurb: 'The wide SHA-2 variant — faster than SHA-256 on 64-bit CPUs.',
    href: FIPS_180_4,
    source: 'NIST FIPS 180-4',
  },
  'sha512-256': {
    blurb: 'SHA-512 cut down to 256 bits. Fast on 64-bit machines, immune to length-extension.',
    href: FIPS_180_4,
    source: 'NIST FIPS 180-4',
  },
  'sha3-256': {
    blurb:
      'The newer SHA-3 standard (built on Keccak), designed differently from SHA-2 as a backup.',
    href: FIPS_202,
    source: 'NIST FIPS 202',
  },
  'sha3-512': {
    blurb: 'The wide SHA-3 variant with a larger security margin.',
    href: FIPS_202,
    source: 'NIST FIPS 202',
  },
  shake128: {
    blurb: 'A SHA-3 “XOF” — like SHA-3 but can emit as many bytes as you ask for.',
    href: FIPS_202,
    source: 'NIST FIPS 202',
  },
  shake256: {
    blurb: 'The wider SHA-3 XOF, with more security headroom than SHAKE128.',
    href: FIPS_202,
    source: 'NIST FIPS 202',
  },
  keccak256: {
    blurb: 'Original-padding Keccak — the exact hash Ethereum uses everywhere.',
    href: 'https://keccak.team/keccak.html',
    source: 'keccak.team',
  },
  keccak512: {
    blurb: 'The wide variant of original-padding Keccak.',
    href: 'https://keccak.team/keccak.html',
    source: 'keccak.team',
  },
  ripemd160: {
    blurb: 'A 160-bit hash from the ’90s, still used to shorten Bitcoin and Ethereum addresses.',
    href: 'https://homes.esat.kuleuven.be/~bosselae/ripemd160.html',
    source: 'RIPEMD-160',
  },
  sha1: {
    blurb:
      'The old 160-bit web hash. Broken for security (real collisions exist) but still git’s object id. Here for nostalgia.',
    href: 'https://shattered.io/',
    source: 'SHAttered',
  },
  md5: {
    blurb:
      'The classic 128-bit checksum. Broken for security — fine for non-security IDs, included for recognizability.',
    href: 'https://www.rfc-editor.org/rfc/rfc1321',
    source: 'RFC 1321',
  },
};

const GRAMMAR_SRC = (id: GrammarId) =>
  `https://github.com/eshlox/hashglyph/blob/main/packages/core/src/grammar/${id}.ts`;

/** One plain note per grammar. Keyed by GrammarId so every shipped grammar is covered. */
export const GRAMMAR_NOTES: Record<GrammarId, GlossaryNote> = {
  'core-accents-v1': {
    blurb:
      'The default look: a fixed brand shell with a handful of pixels painted by the hash. Reads as a logo, not noise.',
    href: GRAMMAR_SRC('core-accents-v1'),
    source: 'source',
  },
  'mirror-identicon-v1': {
    blurb: 'Left/right-mirrored dots, like the classic GitHub identicon.',
    href: GRAMMAR_SRC('mirror-identicon-v1'),
    source: 'source',
  },
  'symmetric-mask-v1': {
    blurb: 'Hash pixels clipped to a diamond mask, so it always lands as a clean badge silhouette.',
    href: GRAMMAR_SRC('symmetric-mask-v1'),
    source: 'source',
  },
  'quad-fold-v1': {
    blurb: 'One corner mirrored four ways into a balanced, kaleidoscopic ornament.',
    href: GRAMMAR_SRC('quad-fold-v1'),
    source: 'source',
  },
  'cellular-automata-v1': {
    blurb: 'A Rule-90 pattern grown row by row from a hashed starting line — the nerdy one.',
    href: GRAMMAR_SRC('cellular-automata-v1'),
    source: 'source',
  },
};

/** Other cryptographic / engineering concepts the pipeline relies on. */
export const CONCEPTS: ReadonlyArray<GlossaryNote & { term: string }> = [
  {
    term: 'Seed normalization (NFKC)',
    blurb:
      'Before hashing we Unicode-normalize, trim, and lowercase your text, so visually identical names map to the same glyph.',
    href: 'https://unicode.org/reports/tr15/',
    source: 'Unicode UAX #15',
  },
  {
    term: 'Domain separation',
    blurb:
      'We prefix the grammar id before hashing (grammar-id|name). Same name, different grammar → a genuinely different mark.',
    href: 'https://github.com/eshlox/hashglyph#the-determinism-contract',
    source: 'determinism contract',
  },
  {
    term: 'XOF (extendable output)',
    blurb:
      'A hash that emits any number of bytes you ask for. BLAKE3 and SHAKE are XOFs, so they fill the grid natively.',
    href: FIPS_202,
    source: 'NIST FIPS 202',
  },
  {
    term: 'Counter expansion (HKDF-style)',
    blurb:
      'Fixed-length hashes can’t stretch, so we re-hash with a rising counter and concatenate until the grid is full.',
    href: 'https://www.rfc-editor.org/rfc/rfc5869',
    source: 'RFC 5869 (HKDF)',
  },
  {
    term: 'Bitstream (MSB-first)',
    blurb:
      'The digest is read one bit at a time, most-significant bit first; each bit decides whether a pixel is on.',
    href: 'https://github.com/eshlox/hashglyph#how-it-works',
    source: 'how it works',
  },
  {
    term: 'QR mode',
    blurb: 'Optionally encodes a link as a standard QR code with your glyph centered inside it.',
    href: 'https://www.qrcode.com/en/about/standards.html',
    source: 'QR standard',
  },
];
