# @eshlox/hashglyph-core

The isomorphic engine behind [HashGlyph](https://hashglyph.eshlox.net):
deterministic, reversible pixel glyphs from any seed. Runs identically in Node
and the browser, with zero Node-only dependencies.

```ts
import { generateGlyph, renderSvg, decodeGlyphHex, verifyGlyph } from '@eshlox/hashglyph-core';

const glyph = generateGlyph({ seed: 'your-name' });     // hash + style pluggable
const svg = renderSvg(glyph, { fg: '#0b0e14', bg: '#fff', padding: 1 });

decodeGlyphHex(glyph.grid, 'mono-16');                     // → the 256-bit digest
verifyGlyph(glyph.grid, 'mono-16', 'your-name', 'blake3'); // → true
```

- The whole 256-bit digest is encoded losslessly, so a glyph is unique per
  `(hash, seed)` (collision-infeasible under a strong hash) and decodes back to
  its digest. The original seed stays unrecoverable.
- 17 pluggable hashes, each tagged with a collision-resistance `tier`
  (`strong`/`reduced`/`broken`); `blake3` is the default.
- 2 render styles: `mono-16` (16x16 black & white) and `color-8` (8x8 mosaic).
  The style only changes how the same digest is drawn.
- Escape-by-construction SVG renderer, QR rendering, pure-TS ICO + ZIP encoders.

HashGlyph's own logo is just the glyph for the seed `hashglyph`:

```
blake3( hashglyph-v2 | hashglyph ) = 70d824582c9c3e35…fcfd60e7
```

See the [project README](https://github.com/eshlox/hashglyph) for the full
determinism contract and stability policy. MIT © eshlox.
