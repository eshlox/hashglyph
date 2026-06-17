# @eshlox/hashglyph-cli

Command-line generator for [HashGlyph](https://hashglyph.eshlox.net)
deterministic pixel logos.

```bash
npx @eshlox/hashglyph-cli generate eshlox --json --ascii
```

| Command | Output |
| --- | --- |
| `generate <seed>` | SVG, optional JSON, PNG set |
| `favicon <seed>` | 16/32/48/180/192/512 PNGs + `favicon.ico` + manifest |
| `og <seed>` | 1200×630 Open Graph card |
| `qr <url>` | QR code, optionally with a centered glyph (`--seed`) |
| `ascii <seed>` | Print the glyph to your terminal |
| `list` | List available hashes and grammars |

Shared options: `--hash --grammar --fg --bg --rounded --padding --scale --out`.

Output filenames are derived from a safe slug and can never escape the chosen
output directory. PNGs are rendered with sharp (nearest-neighbour, crisp).

See the [project README](https://github.com/eshlox/hashglyph). MIT © eshlox.
