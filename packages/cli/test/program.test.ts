import { describe, expect, it } from 'vitest';
import {
  type Artifact,
  buildProgram,
  type IO,
  resolveGlyphOptions,
  runDecode,
  runGenerate,
  runVerify,
} from '../src/index.js';

function fakeIO(): { io: IO; out: string[]; err: string[] } {
  const out: string[] = [];
  const err: string[] = [];
  return {
    io: { log: (m = '') => out.push(m), warn: (m) => err.push(m), error: (m) => err.push(m) },
    out,
    err,
  };
}

/** A write spy so command parsing can be tested without touching the disk. */
function spyWrite() {
  const calls: { dir: string; artifacts: readonly Artifact[] }[] = [];
  const write = async (dir: string, artifacts: readonly Artifact[]) => {
    calls.push({ dir, artifacts });
    return artifacts.map((a) => `${dir}/${a.name}`);
  };
  return { calls, write };
}

async function run(argv: string[], io: IO, write = spyWrite().write) {
  const program = buildProgram({ io, write, exitOverride: true });
  await program.parseAsync(['node', 'hashglyph', ...argv]);
}

describe('CLI program', () => {
  it('list prints all hashes (with tiers) and styles', async () => {
    const { io, out } = fakeIO();
    await run(['list'], io);
    const text = out.join('\n');
    expect(text).toContain('blake3');
    expect(text).toContain('mono-16');
    expect(text).toContain('color-8');
    expect(text).toContain('broken'); // md5/sha1 are flagged
  });

  it('ascii prints the grid and provenance, writes nothing', async () => {
    const { io, out } = fakeIO();
    const { calls, write } = spyWrite();
    await run(['ascii', 'hashglyph', '--no-color'], io, write);
    expect(out.join('\n')).toContain('blake3 × mono-16');
    expect(calls).toHaveLength(0);
  });

  it('generate writes artifacts to the chosen directory', async () => {
    const { io } = fakeIO();
    const { calls, write } = spyWrite();
    await run(['generate', 'hashglyph', '--out', 'myout', '--no-png'], io, write);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.dir).toBe('myout');
    expect(calls[0]?.artifacts.some((a) => a.name.endsWith('.svg'))).toBe(true);
  });

  it('rejects an unknown hash with a clean error', async () => {
    const { io } = fakeIO();
    await expect(run(['generate', 'hashglyph', '--hash', 'crc32', '--no-png'], io)).rejects.toThrow(
      /Unknown --hash/,
    );
  });

  it('rejects an unsafe color', async () => {
    const { io } = fakeIO();
    await expect(run(['generate', 'hashglyph', '--fg', 'url(#x)', '--no-png'], io)).rejects.toThrow(
      /not a valid\/safe color/,
    );
  });

  it('rejects an out-of-range PNG size', async () => {
    const { io } = fakeIO();
    await expect(run(['generate', 'hashglyph', '--size', '99999'], io)).rejects.toThrow(
      /between 1 and 8192/,
    );
  });

  it('rejects an out-of-range qr size', async () => {
    const { io } = fakeIO();
    await expect(run(['qr', 'https://x.test', '--size', '99999'], io)).rejects.toThrow(
      /between 1 and 8192/,
    );
  });

  it('rejects an over-cap qr payload with a clean error', async () => {
    const { io } = fakeIO();
    await expect(run(['qr', `https://x.test/${'a'.repeat(512)}`], io)).rejects.toThrow(
      /at most 512 characters/,
    );
  });

  it('passes --fg/--bg through to the QR code', async () => {
    const { io } = fakeIO();
    const { calls, write } = spyWrite();
    await run(
      ['qr', 'https://x.test', '--fg', '#ff0000', '--bg', '#00ff00', '--out', 'o'],
      io,
      write,
    );
    const svg = calls[0]?.artifacts.find((a) => a.name.endsWith('.svg'))?.data as string;
    expect(svg).toContain('#ff0000');
    expect(svg).toContain('#00ff00');
  });

  it('rejects an unknown style with a clean error', async () => {
    const { io } = fakeIO();
    await expect(run(['generate', 'hashglyph', '--style', 'nope', '--no-png'], io)).rejects.toThrow(
      /Unknown --style/,
    );
  });

  it('supports --version', async () => {
    const { io, out } = fakeIO();
    await expect(run(['--version'], io)).rejects.toThrow(); // exitOverride throws on version
    expect(out.join('\n')).toContain('1.0.0');
  });
});

describe('decode / verify round-trip on generated SVG', () => {
  async function svgFor(seed: string, style: 'mono-16' | 'color-8'): Promise<string> {
    const options = resolveGlyphOptions({ style });
    const result = await runGenerate({ seed, options, sizes: [], json: false, ascii: false });
    return result.artifacts.find((a) => a.name.endsWith('.svg'))?.data as string;
  }

  for (const style of ['mono-16', 'color-8'] as const) {
    it(`decodes a ${style} SVG back to its digest and verifies the seed`, async () => {
      const svg = await svgFor('acme', style);
      const digestLine = runDecode({ svg, style }).summary.find((l) => l.includes('digest'));
      expect(digestLine).toMatch(/[0-9a-f]{64}/);

      // Case-insensitive seed (normalization) still verifies; wrong seed/hash do not.
      expect(runVerify({ svg, style, seed: 'ACME', hash: 'blake3' }).ok).toBe(true);
      expect(runVerify({ svg, style, seed: 'other', hash: 'blake3' }).ok).toBe(false);
      expect(runVerify({ svg, style, seed: 'acme', hash: 'sha256' }).ok).toBe(false);
    });
  }
});
