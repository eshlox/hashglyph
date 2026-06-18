import { readFile } from 'node:fs/promises';
import { Command, CommanderError } from 'commander';
import pc from 'picocolors';
import type { CommandResult } from './artifacts.js';
import { runAscii } from './commands/ascii.js';
import { runDecode } from './commands/decode.js';
import { runFavicon } from './commands/favicon.js';
import { runGenerate } from './commands/generate.js';
import { runList } from './commands/list.js';
import { runOg } from './commands/og.js';
import { runQr } from './commands/qr.js';
import { runVerify } from './commands/verify.js';
import type { IO } from './io.js';
import {
  DEFAULT_PNG_SIZES,
  MAX_RENDER_SIZE,
  parseHash,
  parseQrUrl,
  parseRenderSize,
  parseStyle,
  type RawGlyphOptions,
  resolveGlyphOptions,
} from './options.js';
import { writeArtifacts } from './runner.js';

const VERSION = '1.0.0';

interface BuildOptions {
  io: IO;
  /** Override the writer (tests). Defaults to writing real files. */
  write?: typeof writeArtifacts;
  /** Throw instead of calling process.exit (tests). */
  exitOverride?: boolean;
}

/** Hash + style selection (which glyph), plus its colours. */
function addGlyphPickerOptions(cmd: Command): Command {
  return cmd
    .option('--hash <id>', 'hash function (see `list`)', 'blake3')
    .option('--style <id>', 'render style (see `list`)', 'mono-16')
    .option('--fg <color>', 'foreground color (hex/name)')
    .option('--bg <color>', 'background color, or "none" for transparent');
}

/** Full render options for raster commands (adds shape/padding/scale). */
function addGlyphOptions(cmd: Command): Command {
  return addGlyphPickerOptions(cmd)
    .option('--rounded', 'use rounded pixels')
    .option('--padding <cells>', 'quiet-zone padding in cells')
    .option('--scale <px>', 'rendered pixels per cell');
}

function collect(value: string, previous: number[]): number[] {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > MAX_RENDER_SIZE) {
    throw new CommanderError(
      1,
      'hashglyph.size',
      `--size must be an integer between 1 and ${MAX_RENDER_SIZE}, got "${value}".`,
    );
  }
  return [...previous, n];
}

/** Build the configured CLI program. Pure wiring, all logic lives in commands. */
export function buildProgram(opts: BuildOptions): Command {
  const { io } = opts;
  const write = opts.write ?? writeArtifacts;
  const program = new Command();

  program
    .name('hashglyph')
    .description('Deterministic pixel-glyph logo generator.')
    .version(VERSION, '-v, --version')
    .configureOutput({
      writeOut: (s) => io.log(s.replace(/\n$/, '')),
      writeErr: (s) => io.warn(s.replace(/\n$/, '')),
    });

  if (opts.exitOverride) program.exitOverride();

  const printResult = (result: CommandResult): void => {
    for (const line of result.summary) io.log(line);
  };

  const runAndWrite = async (outDir: string, result: CommandResult): Promise<void> => {
    if (result.artifacts.length > 0) {
      io.log(pc.dim(`Writing ${result.artifacts.length} file(s) to ${outDir}`));
      await write(outDir, result.artifacts, io);
    }
    printResult(result);
  };

  addGlyphOptions(
    program
      .command('generate <seed>')
      .description('Generate an SVG (+ optional JSON & PNGs) for a seed')
      .option('--out <dir>', 'output directory', 'dist')
      .option('--size <px>', 'PNG size to emit (repeatable)', collect, [])
      .option('--no-png', 'skip PNG export')
      .option('--json', 'also write JSON metadata', false)
      .option('--ascii', 'also print the grid to the terminal', false),
  ).action(async (seed: string, raw: RawGlyphOptions & GenerateFlags) => {
    const options = resolveGlyphOptions(raw);
    const sizes = raw.png === false ? [] : raw.size.length > 0 ? raw.size : [...DEFAULT_PNG_SIZES];
    const result = await runGenerate({ seed, options, sizes, json: raw.json, ascii: raw.ascii });
    await runAndWrite(raw.out, result);
  });

  addGlyphOptions(
    program
      .command('favicon <seed>')
      .description('Generate a full favicon / PWA icon set (+ favicon.ico, manifest)')
      .option('--out <dir>', 'output directory', 'dist/favicons'),
  ).action(async (seed: string, raw: RawGlyphOptions & { out: string }) => {
    const options = resolveGlyphOptions(raw);
    await runAndWrite(raw.out, await runFavicon({ seed, options }));
  });

  addGlyphOptions(
    program
      .command('og <seed>')
      .description('Generate a 1200×630 Open Graph card (PNG + SVG)')
      .option('--out <dir>', 'output directory', 'dist')
      .option('--title <text>', 'card title')
      .option('--slogan <text>', 'card slogan')
      .option('--url <text>', 'card URL line'),
  ).action(async (seed: string, raw: RawGlyphOptions & OgFlags) => {
    const options = resolveGlyphOptions(raw);
    const og = {
      ...(raw.title !== undefined ? { title: raw.title } : {}),
      ...(raw.slogan !== undefined ? { slogan: raw.slogan } : {}),
      ...(raw.url !== undefined ? { url: raw.url } : {}),
    };
    await runAndWrite(raw.out, await runOg({ seed, options, og }));
  });

  addGlyphPickerOptions(
    program
      .command('qr <url>')
      .description('Generate a QR code, optionally with a centered glyph')
      .option('--out <dir>', 'output directory', 'dist')
      .option('--seed <seed>', 'embed a glyph generated from this seed')
      .option('--size <px>', 'PNG size', '1024'),
  ).action(async (rawUrl: string, raw: RawGlyphOptions & QrFlags) => {
    const url = parseQrUrl(rawUrl);
    const options = resolveGlyphOptions(raw);
    const size = parseRenderSize('size', raw.size);
    // --fg/--bg recolour the QR (the centered glyph inherits them). The other
    // glyph render options don't apply to a QR, so they aren't offered here.
    const colors = {
      ...(typeof options.svg.fg === 'string' ? { fg: options.svg.fg } : {}),
      ...(typeof options.svg.bg === 'string' ? { bg: options.svg.bg } : {}),
    };
    await runAndWrite(raw.out, await runQr({ url, seed: raw.seed ?? null, options, size, colors }));
  });

  addGlyphOptions(
    program
      .command('ascii <seed>')
      .description('Print the glyph to the terminal (no files written)')
      .option('--no-color', 'disable ANSI color'),
  ).action((seed: string, raw: RawGlyphOptions & { color: boolean }) => {
    const options = resolveGlyphOptions(raw);
    printResult(runAscii({ seed, options, color: raw.color }));
  });

  program
    .command('decode <file>')
    .description('Read the digest back out of a HashGlyph SVG')
    .option('--style <id>', 'render style of the SVG', 'mono-16')
    .action(async (file: string, raw: { style: string }) => {
      const svg = await readFile(file, 'utf8');
      printResult(runDecode({ svg, style: parseStyle(raw.style) }));
    });

  program
    .command('verify <file> <seed>')
    .description('Check that a HashGlyph SVG is the glyph for a given seed')
    .option('--hash <id>', 'hash the seed was generated with', 'blake3')
    .option('--style <id>', 'render style of the SVG', 'mono-16')
    .action(async (file: string, seed: string, raw: { hash: string; style: string }) => {
      const svg = await readFile(file, 'utf8');
      const result = runVerify({
        svg,
        seed,
        hash: parseHash(raw.hash),
        style: parseStyle(raw.style),
      });
      printResult(result);
      if (!result.ok) process.exitCode = 1;
    });

  program
    .command('list')
    .description('List available hashes and styles')
    .action(() => {
      printResult(runList());
    });

  return program;
}

interface GenerateFlags {
  out: string;
  size: number[];
  png: boolean;
  json: boolean;
  ascii: boolean;
}
interface OgFlags {
  out: string;
  title?: string;
  slogan?: string;
  url?: string;
}
interface QrFlags {
  out: string;
  seed?: string;
  size: string;
}
