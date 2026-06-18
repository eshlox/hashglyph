/** Base class for every error thrown intentionally by HashGlyph core. */
export class HashGlyphError extends Error {
  override readonly name: string = 'HashGlyphError';
}

/** Thrown when a seed normalizes to an empty string (nothing to hash). */
export class EmptySeedError extends HashGlyphError {
  override readonly name = 'EmptySeedError';
  constructor() {
    super('Seed is empty after normalization. Provide at least one visible character.');
  }
}

/** Thrown when an unknown hash or style id is requested. */
export class UnknownAlgorithmError extends HashGlyphError {
  override readonly name = 'UnknownAlgorithmError';
  constructor(kind: 'hash' | 'style', id: string, known: readonly string[]) {
    super(`Unknown ${kind} "${id}". Known ${kind}s: ${known.join(', ')}.`);
  }
}

/** Thrown when a render option (e.g. a colour token) is rejected as unsafe. */
export class InvalidRenderOptionError extends HashGlyphError {
  override readonly name = 'InvalidRenderOptionError';
  constructor(option: string, value: string) {
    super(`Invalid value for render option "${option}": ${JSON.stringify(value)}.`);
  }
}
