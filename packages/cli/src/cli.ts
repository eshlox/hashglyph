#!/usr/bin/env node
import pc from 'picocolors';
import { consoleIO } from './io.js';
import { OptionError } from './options.js';
import { PathEscapeError } from './paths.js';
import { buildProgram } from './program.js';

async function main(): Promise<void> {
  const program = buildProgram({ io: consoleIO });
  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    // Known, user-facing errors: print a clean message, no stack trace.
    if (
      error instanceof OptionError ||
      error instanceof PathEscapeError ||
      (error instanceof Error && error.name === 'EmptySeedError') ||
      (error instanceof Error && error.name === 'UnknownAlgorithmError')
    ) {
      consoleIO.error(`${pc.red('error')} ${error.message}`);
      process.exitCode = 1;
      return;
    }
    throw error;
  }
}

main().catch((error: unknown) => {
  consoleIO.error(`${pc.red('fatal')} ${error instanceof Error ? error.stack : String(error)}`);
  process.exitCode = 1;
});
