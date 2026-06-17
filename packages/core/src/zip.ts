import { zipSync } from 'fflate';

/** A file to place into a zip archive: path → bytes. */
export type ZipFiles = Record<string, Uint8Array>;

/**
 * Fixed timestamp for every zip entry: 1980-01-01, the minimum the ZIP/DOS
 * time format can represent. Hard-coding it keeps archives byte-stable.
 */
const ZIP_EPOCH = Date.UTC(1980, 0, 1);

/**
 * Create a deterministic (uncompressed, fixed mtime) zip archive from a map of
 * path → bytes. Determinism keeps "download all assets" bundles byte-stable and
 * reproducible. Isomorphic via `fflate`.
 */
export function createZip(files: ZipFiles): Uint8Array {
  return zipSync(files, { level: 0, mtime: ZIP_EPOCH });
}
