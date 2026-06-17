# Contributing to HashGlyph

Thanks for your interest! A few project-specific rules keep the marks stable.

## The golden rule: never mutate a shipped `-vN`

The whole point of HashGlyph is that a seed maps to the same glyph forever. So:

- **Never** change a shipped grammar's id, `materialId`, bit-consumption order,
  or cell mapping. That would silently change everyone's logo.
- To evolve the visual system, register a **new** grammar with an incremented
  version suffix (e.g. `core-accents-v2`) and keep the old one in the registry.
- The canonical golden test (`packages/core/test/canonical.golden.test.ts`) must
  never need updating. If it fails, you broke the contract, so revert.

The same applies to the normalization recipe and material template
(`MATERIAL_SCHEMA`) and the MSB-first bitstream order.

## Adding a grammar

1. Create `packages/core/src/grammar/<id>.ts` exporting a `GlyphGrammar`.
   Declare a unique `materialId`, a `byteBudget`, and make it mirror-symmetric
   so output reads as a mark.
2. Register it in `grammar/registry.ts` and `GRAMMAR_IDS`.
3. Add a determinism snapshot. The per-combo snapshot test will pick it up.
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
