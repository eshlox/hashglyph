import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { Artifact } from './artifacts.js';
import type { IO } from './io.js';
import { resolveInside } from './paths.js';

/**
 * Write a command's artifacts into `outDir`, safely. Every filename is resolved
 * through {@link resolveInside}, so nothing can escape the output directory even
 * if a name were ever derived from untrusted input.
 *
 * @returns the absolute paths written.
 */
export async function writeArtifacts(
  outDir: string,
  artifacts: readonly Artifact[],
  io: IO,
): Promise<string[]> {
  const written: string[] = [];
  await mkdir(outDir, { recursive: true });

  for (const artifact of artifacts) {
    const target = resolveInside(outDir, artifact.name);
    await mkdir(dirname(target), { recursive: true });
    const data = typeof artifact.data === 'string' ? artifact.data : Buffer.from(artifact.data);
    await writeFile(target, data);
    written.push(target);
    io.log(`  ✓ ${target}`);
  }

  return written;
}
