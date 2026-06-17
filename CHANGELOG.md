# Changelog

All notable changes to HashGlyph are documented here. The project adheres to
[Semantic Versioning](https://semver.org/). Generated glyphs follow a separate
**stability policy**: a shipped `-vN` grammar never changes; new behaviour ships
as a new versioned grammar.

## [Unreleased]

### Added

- **More hashes (6 → 17)**: BLAKE2b, BLAKE2s, SHA-224, SHA-384, SHA-512/256,
  SHAKE128, SHAKE256, Keccak-512, RIPEMD-160, SHA-1, and MD5 join the registry —
  now **17 hashes × 5 grammars = 85 combinations**. SHAKE uses its native XOF
  like BLAKE3; the rest use the existing counter expansion. SHA-1/MD5 are
  cryptographically broken and included only for recognizability. Additive and
  non-breaking: the canonical BLAKE3 mark is untouched.
- **Website glossary**: a plain-English section explaining every hash, grammar,
  and pipeline concept (normalization, domain separation, XOF, counter
  expansion, bitstream, QR), each with a link to its authoritative source.

### Fixed

- **Website footer**: vertical padding was silently overridden by `.wrap`, so
  the footer hugged the window edge and the border above it. Now spaced.

## [1.0.0] - 2026-06-17

### Added

- **`@eshlox/hashglyph-core`**: isomorphic deterministic glyph engine.
  Normalization, a pluggable hash registry (BLAKE3, SHA-256/512, SHA3-256/512,
  Keccak-256) with XOF/counter expansion, MSB-first bitstream, five frozen
  visual grammars, an escape-by-construction SVG renderer, QR rendering with a
  centered-glyph composite, and pure-TS ICO + ZIP encoders.
- **`@eshlox/hashglyph-cli`**: the `hashglyph` CLI with `generate`, `favicon`,
  `og`, `qr`, `ascii`, and `list`. PNG via sharp, path-traversal-safe output,
  and a built-in pixel font for reproducible Open Graph cards.
- **Website**: an Astro static single-page app for hashglyph.eshlox.net with
  live preview, colour/pixel controls, a hash × grammar picker, shareable
  permalinks, SVG/PNG/ICO/ZIP/QR downloads, and full SEO + JSON-LD.
- **Brand**: frozen, byte-reproducible logo, favicons, and OG image generated
  from HashGlyph's own seed (`hashglyph`), verified in CI.

### Canonical mark (frozen)

HashGlyph's own logo is the glyph for the seed `hashglyph` (the same engine
everyone uses):

```
blake3( hashglyph-core-accents-v1 | hashglyph ) = bfd24b02875f3d34…f2ee0010
```
