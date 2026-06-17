import { InvalidRenderOptionError } from '../errors.js';

/** Basic CSS color keywords we accept in addition to hex / functional forms. */
const NAMED_COLORS = new Set([
  'transparent',
  'none',
  'black',
  'white',
  'red',
  'green',
  'blue',
  'yellow',
  'cyan',
  'magenta',
  'gray',
  'grey',
  'silver',
  'maroon',
  'olive',
  'lime',
  'aqua',
  'teal',
  'navy',
  'fuchsia',
  'purple',
  'orange',
]);

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
// rgb()/rgba()/hsl()/hsla() with a restricted, injection-safe character set.
const FUNCTIONAL = /^(?:rgb|rgba|hsl|hsla)\([0-9.,%\s/]+\)$/i;

/**
 * Validate that `value` is a safe color token to embed in an SVG attribute.
 *
 * We allow hex, a small set of CSS keywords, and `rgb()/hsl()` functional forms
 * with a restricted character set. Anything else is rejected so that untrusted
 * input can never smuggle markup into the output (defense-in-depth alongside
 * attribute escaping).
 */
export function isSafeColor(value: string): boolean {
  const token = value.trim().toLowerCase();
  return NAMED_COLORS.has(token) || HEX.test(token) || FUNCTIONAL.test(token);
}

/** Assert a color is safe and return it trimmed. @throws {InvalidRenderOptionError} */
export function assertSafeColor(option: string, value: string): string {
  const token = value.trim();
  if (!isSafeColor(token)) {
    throw new InvalidRenderOptionError(option, value);
  }
  return token;
}
