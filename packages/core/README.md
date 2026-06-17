# @eshlox/hashglyph-core

The isomorphic engine behind [HashGlyph](https://hashglyph.eshlox.net) —
deterministic pixel glyphs from any seed. Runs identically in Node and the
browser, with zero Node-only dependencies.

```ts
import { generateGlyph, renderSvg, GRAMMARS, HASHES } from '@eshlox/hashglyph-core';

const glyph = generateGlyph({ seed: 'eshlox' });        // hash + grammar pluggable
const svg = renderSvg(glyph, { fg: '#0b0e14', bg: '#fff', padding: 1 });
```

- Pluggable hashes: `blake3` (default), `sha256`, `sha512`, `sha3-256`, `sha3-512`, `keccak256`.
- Pluggable grammars: `core-accents-v1` (canonical), `mirror-identicon-v1`, `symmetric-mask-v1`, `quad-fold-v1`, `cellular-automata-v1`.
- Escape-by-construction SVG renderer, QR rendering, pure-TS ICO + ZIP encoders.

The canonical mark is frozen forever:

```
blake3( eshlox-deterministic-glyph-v1 | eshlox ) = 4b343318ccb00312…d600440
```

See the [project README](https://github.com/eshlox/hashglyph) for the full
determinism contract and stability policy. MIT © eshlox.
