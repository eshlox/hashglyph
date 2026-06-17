import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

const CANONICAL_DIGEST_PREFIX = 'bfd24b02';

test.describe('HashGlyph site', () => {
  test('renders SEO metadata and JSON-LD', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/HashGlyph/);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      /og-image\.png$/,
    );
    const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
    expect(jsonLd).toContain('SoftwareApplication');
    expect(jsonLd).toContain('https://fosstodon.org/@eshlox'); // sameAs
  });

  test('shows the author social links in the footer', async ({ page }) => {
    await page.goto('/');
    const social = page.locator('.social');
    await expect(social.getByRole('link', { name: 'X' })).toHaveAttribute(
      'href',
      'https://x.com/eshlox',
    );
    await expect(social.getByRole('link', { name: 'Bluesky' })).toHaveAttribute(
      'href',
      'https://bsky.app/profile/eshlox.net',
    );
    await expect(social.getByRole('link', { name: 'Mastodon' })).toHaveAttribute(
      'href',
      'https://fosstodon.org/@eshlox',
    );
    // rel="me" enables Mastodon's verified-link checkmark.
    await expect(social.getByRole('link', { name: 'Mastodon' })).toHaveAttribute('rel', /me/);
  });

  test('shows the canonical mark on first load (core runs in-browser)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#preview svg')).toBeVisible();
    await expect(page.locator('#digest')).toHaveText(new RegExp(`^${CANONICAL_DIGEST_PREFIX}`));
    await expect(page.locator('#material')).toHaveText('hashglyph-core-accents-v1|hashglyph');
  });

  test('typing a seed updates the glyph and the permalink', async ({ page }) => {
    await page.goto('/');
    const before = await page.locator('#digest').textContent();
    await page.fill('#seed', 'ada');
    await expect(page.locator('#digest')).not.toHaveText(before ?? '');
    await expect(page).toHaveURL(/seed=ada/);
    await expect(page.locator('#permalink')).toHaveValue(/seed=ada/);
  });

  test('permalink round-trips state from the URL', async ({ page }) => {
    await page.goto('/?seed=portal&grammar=quad-fold-v1&hash=sha256');
    await expect(page.locator('#seed')).toHaveValue('portal');
    await expect(page.locator('#grammar')).toHaveValue('quad-fold-v1');
    await expect(page.locator('#hash')).toHaveValue('sha256');
  });

  test('invalid permalink params fall back to defaults (never throws)', async ({ page }) => {
    await page.goto('/?grammar=evil&hash=crc32&fg=url(%23x)');
    await expect(page.locator('#preview svg')).toBeVisible();
    await expect(page.locator('#grammar')).toHaveValue('core-accents-v1');
    await expect(page.locator('#hash')).toHaveValue('blake3');
  });

  test('the grammar matrix has all grammars and is clickable', async ({ page }) => {
    await page.goto('/');
    const cells = page.locator('#matrix .matrix-cell');
    await expect(cells).toHaveCount(5);
    await cells.nth(2).click();
    await expect(page.locator('#grammar')).toHaveValue('symmetric-mask-v1');
    await expect(page).toHaveURL(/grammar=symmetric-mask-v1/);
  });

  test('copy SVG writes valid SVG markup to the clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
    await page.click('#copy-svg');
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    expect(clip).toContain('<svg');
    expect(clip).toContain('</svg>');
    expect(clip).not.toContain('<script');
  });

  test('downloads a valid PNG of the requested size', async ({ page }) => {
    await page.goto('/');
    await page.selectOption('#png-size', '32');
    const [download] = await Promise.all([page.waitForEvent('download'), page.click('#dl-png')]);
    expect(download.suggestedFilename()).toMatch(/-32\.png$/);
    const path = await download.path();
    const bytes = await readFile(path);
    // PNG signature + IHDR dimensions.
    expect(bytes.subarray(0, 4)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    expect(bytes.readUInt32BE(16)).toBe(32);
    expect(bytes.readUInt32BE(20)).toBe(32);
  });

  test('downloads a non-empty asset zip', async ({ page }) => {
    await page.goto('/');
    const [download] = await Promise.all([page.waitForEvent('download'), page.click('#dl-zip')]);
    expect(download.suggestedFilename()).toMatch(/\.zip$/);
    const bytes = await readFile(await download.path());
    expect(bytes.length).toBeGreaterThan(500);
    expect(bytes.subarray(0, 2)).toEqual(Buffer.from('PK')); // zip magic
  });

  test('QR mode points at a custom URL, shares it, and downloads', async ({ page }) => {
    await page.goto('/');
    await page.check('#qr-toggle');
    await expect(page.locator('#qr-preview svg')).toBeVisible();

    // Point the QR at a custom site; it lands in the permalink.
    await page.fill('#qr-url', 'https://example.com/me');
    await expect(page).toHaveURL(/qrurl=/);
    await expect(page.locator('#permalink')).toHaveValue(/example\.com/);

    const [download] = await Promise.all([page.waitForEvent('download'), page.click('#dl-qr')]);
    expect(download.suggestedFilename()).toMatch(/-qr\.png$/);
  });

  test('QR mode + target hydrate from a shared permalink', async ({ page }) => {
    await page.goto('/?qrurl=https%3A%2F%2Fexample.org');
    await expect(page.locator('#qr-toggle')).toBeChecked();
    await expect(page.locator('#qr-url')).toHaveValue('https://example.org');
    await expect(page.locator('#qr-preview svg')).toBeVisible();
  });

  test('color and transparency changes are reflected in the SVG', async ({ page }) => {
    await page.goto('/');
    await page.check('#transparent');
    const svgHtml = await page.locator('#preview').innerHTML();
    expect(svgHtml).not.toContain('#ffffff');
  });
});
