import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const SRC_DIR = fileURLToPath(new URL('../src', import.meta.url));

function collectTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...collectTsFiles(full));
    else if (name.endsWith('.ts')) out.push(full);
  }
  return out;
}

/**
 * The core package must run unchanged in the browser. These static checks fail
 * the build if anyone introduces a Node-only dependency. The real end-to-end
 * proof that core runs in a browser is the Playwright suite in apps/web.
 */
describe('core is isomorphic (no Node-only APIs)', () => {
  const files = collectTsFiles(SRC_DIR);

  it('imports no `node:` builtins', () => {
    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      expect(source, `${file} must not import node: builtins`).not.toMatch(/from ['"]node:/);
      expect(source, `${file} must not require()`).not.toMatch(/\brequire\(/);
    }
  });

  it('references no Node-only globals (process, Buffer, __dirname)', () => {
    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      expect(source, `${file} must not use process`).not.toMatch(/\bprocess\./);
      expect(source, `${file} must not use Buffer`).not.toMatch(/\bBuffer\b/);
      expect(source, `${file} must not use __dirname`).not.toMatch(/__dirname|__filename/);
    }
  });
});
