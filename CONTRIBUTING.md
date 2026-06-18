# Contributing to HashGlyph

Thanks for your interest! A few project-specific rules keep the marks stable.

## The golden rule: never change the frozen encoding

The whole point of HashGlyph is that a seed maps to the same glyph forever, and
that the glyph is a lossless picture of its 256-bit digest. So:

- **Never** change the normalization recipe, the material prefix, the digest
  width, or a style's size / bits-per-cell / bit order / palette under the same
  `MATERIAL_SCHEMA`. Any of those silently changes everyone's glyph and breaks
  `decode`/`verify`.
- To evolve the encoding, bump `MATERIAL_SCHEMA` (e.g. to `v3`) so the change is
  explicit and old glyphs stay attributable to their schema.
- The canonical golden test (`packages/core/test/canonical.golden.test.ts`) must
  never need updating within a schema. If it fails, you broke the contract, so
  revert.

## Adding a render style

A style is a reversible mapping between the 256-bit digest and a grid, so
`size * size * bitsPerCell` must equal 256 and `decode(encode(d)) === d`.

1. Add it to the factory and `PROVIDERS` in `packages/core/src/style/registry.ts`
   with a unique id, `size`, `bitsPerCell`, and palette (index 0 = background).
2. Add it to `StyleId` and `STYLE_IDS`, and add a glossary note in the web app.
3. The round-trip and determinism tests pick it up automatically.
4. `pnpm test && pnpm typecheck && pnpm check`.

## Workflow

```bash
pnpm install
pnpm -r build
pnpm test          # vitest (unit + property + security)
pnpm typecheck     # tsc --build
pnpm check         # biome
pnpm --filter @eshlox/hashglyph-web check   # astro check
```

- TypeScript, ESM, strict. Match the surrounding style; Biome formats.
- Keep `packages/core` **isomorphic**, with no `node:` imports or Node globals
  (enforced by `isomorphism.test.ts`).
- New behaviour needs tests. Security-relevant code needs adversarial tests.

## Releasing brand assets

`pnpm brand:generate` mints assets; `pnpm brand:verify` proves they are
reproducible. Run on Linux so the committed binaries match CI.
