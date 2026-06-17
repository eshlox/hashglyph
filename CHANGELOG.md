# Changelog

All notable changes to HashGlyph are documented here. The project adheres to
[Semantic Versioning](https://semver.org/). Generated glyphs follow a separate
**stability policy**: a shipped `-vN` grammar never changes; new behaviour ships
as a new versioned grammar.

## [1.0.0] — 2026-06-17

### Added

- **`@eshlox/hashglyph-core`** — isomorphic deterministic glyph engine:
  normalization, a pluggable hash registry (BLAKE3, SHA-256/512, SHA3-256/512,
  Keccak-256) with XOF/counter expansion, MSB-first bitstream, five frozen
  visual grammars, an escape-by-construction SVG renderer, QR rendering with a
  centered-glyph composite, and pure-TS ICO + ZIP encoders.
- **`@eshlox/hashglyph-cli`** — `hashglyph` CLI: `generate`, `favicon`, `og`,
  `qr`, `ascii`, `list`. PNG via sharp, path-traversal-safe output, a built-in
  pixel font for reproducible Open Graph cards.
- **Website** — Astro static single-page app for hashglyph.eshlox.net: live
  preview, colour/pixel controls, hash × grammar picker, shareable permalinks,
  SVG/PNG/ICO/ZIP/QR downloads, full SEO + JSON-LD.
- **Brand** — frozen, byte-reproducible logo, favicons, and OG image generated
  from HashGlyph's own seed (`hashglyph`), verified in CI.

### Canonical mark (frozen)

HashGlyph's own logo is the glyph for the seed `hashglyph` (the same engine
everyone uses):

```
blake3( hashglyph-core-accents-v1 | hashglyph ) = bfd24b02875f3d34…f2ee0010
```
