/** An in-memory output file produced by a command, written later by the runner. */
export interface Artifact {
  /** Filename relative to the output directory (never absolute, no `..`). */
  readonly name: string;
  /** File contents. */
  readonly data: Uint8Array | string;
}

/** The result of running a command: files to write plus lines to print. */
export interface CommandResult {
  readonly artifacts: readonly Artifact[];
  readonly summary: readonly string[];
}
