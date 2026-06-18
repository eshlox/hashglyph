# Changelog

All notable changes to HashGlyph are documented here. The project adheres to
[Semantic Versioning](https://semver.org/). Generated glyphs follow a separate
**stability policy**: the encoding is frozen behind a `MATERIAL_SCHEMA` version;
changing it ships as a new schema version.

## [Unreleased]

### Changed (breaking)

- **Reversible, unique 256-bit glyphs**: a glyph now encodes the full 256-bit
  digest losslessly, so two different names sharing a glyph is computationally
  infeasible under a strong hash, and a glyph decodes straight back to its
  digest. The five visual grammars are replaced by two render **styles**:
  `mono-16` (16x16 black & white, 1 bit per pixel) and `color-8` (8x8, 4 bits
  per cell over a fixed 16-color palette). The digest depends only on the
  `(hash, seed)` pair, so both styles render the same identity two ways.
  `MATERIAL_SCHEMA` moves to `v2` and the material prefix to `hashglyph-v2|`, so
  every glyph changes. The CLI/web option `--grammar`/`grammar` becomes
  `--style`/`style`.

### Added

- **Decode and verify**: `decodeGlyph`/`decodeGlyphHex` recover the digest from a
  glyph grid, and `verifyGlyph` proves a `(seed, hash)` pair produced a glyph.
  Exposed on the CLI as `hashglyph decode <file>` and `hashglyph verify <file>
  <seed>`, and as a verify box in the web studio. The original seed stays
  unrecoverable (hashing is one-way).
- **Hash honesty tiers**: every hash now carries a `tier` (`strong`, `reduced`,
  `broken`), surfaced in `list`, the web hash picker, and the glossary so the
  collision-unsafe hashes (MD5, SHA-1) are clearly flagged.
- **More hashes (6 → 17)**: BLAKE2b, BLAKE2s, SHA-224, SHA-384, SHA-512/256,
  SHAKE128, SHAKE256, Keccak-512, RIPEMD-160, SHA-1, and MD5 join the registry.
  SHAKE uses its native XOF like BLAKE3; the rest use the counter expansion.

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
