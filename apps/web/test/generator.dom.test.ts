// @vitest-environment jsdom
import { GRAMMARS, HASHES } from '@eshlox/hashglyph-core';
import { beforeEach, describe, expect, it } from 'vitest';
import { initGenerator } from '../src/scripts/generator.ts';

const hashOptions = HASHES.map((h) => `<option value="${h.id}">${h.label}</option>`).join('');
const grammarOptions = GRAMMARS.map((g) => `<option value="${g.id}">${g.label}</option>`).join('');

/** Build the minimal DOM that initGenerator expects. */
function buildDom(search = ''): void {
  window.history.replaceState(null, '', `/${search}`);
  document.body.innerHTML = `
    <input id="seed" type="text" />
    <p id="seed-error" hidden></p>
    <select id="hash">${hashOptions}</select>
    <select id="grammar">${grammarOptions}</select>
    <input id="fg" type="color" />
    <input id="bg" type="color" />
    <input id="transparent" type="checkbox" />
    <input id="rounded" type="checkbox" />
    <input id="padding" type="range" min="0" max="4" />
    <input id="qr-toggle" type="checkbox" />
    <div id="preview"></div>
    <code id="digest"></code>
    <code id="material"></code>
    <input id="permalink" type="text" />
    <span id="contrast-warning" hidden></span>
    <div id="matrix"></div>
    <div id="qr-preview"></div>
    <section id="qr-section" hidden>
      <input id="qr-url" type="text" />
      <p id="qr-warning" hidden></p>
    </section>
    <select id="png-size"><option value="256">256</option></select>
    <button id="copy-svg"></button><button id="copy-link"></button>
    <button id="dl-svg"></button><button id="dl-png"></button>
    <button id="dl-ico"></button><button id="dl-zip"></button>
    <button id="dl-qr"></button><button id="randomize"></button>
  `;
}

function fire(id: string, type = 'input'): void {
  document.getElementById(id)?.dispatchEvent(new window.Event(type, { bubbles: true }));
}

describe('initGenerator (jsdom — core runs against the DOM)', () => {
  beforeEach(() => buildDom());

  it('renders the canonical mark on load', () => {
    initGenerator();
    expect(document.getElementById('digest')?.textContent).toMatch(/^bfd24b02/);
    expect(document.getElementById('material')?.textContent).toBe(
      'hashglyph-core-accents-v1|hashglyph',
    );
    expect(document.getElementById('preview')?.innerHTML).toContain('<svg');
  });

  it('populates the grammar matrix with every grammar', () => {
    initGenerator();
    expect(document.querySelectorAll('#matrix .matrix-cell')).toHaveLength(GRAMMARS.length);
  });

  it('updates the glyph and permalink when the seed changes', () => {
    initGenerator();
    const before = document.getElementById('digest')?.textContent;
    const seed = document.getElementById('seed') as HTMLInputElement;
    seed.value = 'ada';
    fire('seed');
    expect(document.getElementById('digest')?.textContent).not.toBe(before);
    expect(window.location.search).toContain('seed=ada');
    expect((document.getElementById('permalink') as HTMLInputElement).value).toContain('seed=ada');
  });

  it('hydrates from URL params (permalink round-trip)', () => {
    buildDom('?seed=portal&grammar=quad-fold-v1&hash=sha256');
    initGenerator();
    expect((document.getElementById('seed') as HTMLInputElement).value).toBe('portal');
    expect((document.getElementById('grammar') as HTMLSelectElement).value).toBe('quad-fold-v1');
    expect((document.getElementById('hash') as HTMLSelectElement).value).toBe('sha256');
  });

  it('shows a validation message and clears the stale glyph for an empty seed', () => {
    initGenerator();
    expect(document.getElementById('preview')?.innerHTML).toContain('<svg');
    const seed = document.getElementById('seed') as HTMLInputElement;
    // A single space stays "space" (slice keeps it) → tryNormalizeSeed === null.
    seed.value = '   ';
    fire('seed');
    expect(document.getElementById('seed-error')?.hidden).toBe(false);
    // Stale glyph is cleared, not left pointing at the previous one.
    expect(document.getElementById('preview')?.innerHTML).toBe('');
    expect(document.getElementById('digest')?.textContent).toBe('—');
  });

  it('enables QR mode, renders a code, and puts the target in the permalink', () => {
    initGenerator();
    const qrToggle = document.getElementById('qr-toggle') as HTMLInputElement;
    qrToggle.checked = true;
    fire('qr-toggle', 'change');
    expect((document.getElementById('qr-section') as HTMLElement).hidden).toBe(false);
    expect(document.getElementById('qr-preview')?.innerHTML).toContain('<svg');

    const qrUrl = document.getElementById('qr-url') as HTMLInputElement;
    qrUrl.value = 'https://example.com/me';
    fire('qr-url');
    expect(window.location.search).toContain('qrurl=');
    expect((document.getElementById('permalink') as HTMLInputElement).value).toContain(
      encodeURIComponent('https://example.com/me'),
    );
  });

  it('hydrates QR mode + target from a shared permalink', () => {
    buildDom('?qrurl=https%3A%2F%2Fexample.org');
    initGenerator();
    expect((document.getElementById('qr-toggle') as HTMLInputElement).checked).toBe(true);
    expect((document.getElementById('qr-section') as HTMLElement).hidden).toBe(false);
    expect((document.getElementById('qr-url') as HTMLInputElement).value).toBe(
      'https://example.org',
    );
    expect(document.getElementById('qr-preview')?.innerHTML).toContain('<svg');
  });
});
