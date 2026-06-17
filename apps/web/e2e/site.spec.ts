import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

const CANONICAL_DIGEST_PREFIX = '4b343318';

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
  });

  test('shows the canonical eshlox glyph on first load (core runs in-browser)', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.locator('#preview svg')).toBeVisible();
    await expect(page.locator('#digest')).toHaveText(new RegExp(`^${CANONICAL_DIGEST_PREFIX}`));
    await expect(page.locator('#material')).toHaveText('eshlox-deterministic-glyph-v1|eshlox');
  });

  test('typing a seed updates the glyph and the permalink', async ({ page }) => {
    await page.goto('/');
    const before = await page.locator('#digest').textContent();
    await page.fill('#seed', 'vertolabs');
    await expect(page.locator('#digest')).not.toHaveText(before ?? '');
    await expect(page).toHaveURL(/seed=vertolabs/);
    await expect(page.locator('#permalink')).toHaveValue(/seed=vertolabs/);
  });

  test('permalink round-trips state from the URL', async ({ page }) => {
    await page.goto('/?seed=portal&grammar=quad-fold-v1&hash=sha256');
    await expect(page.locator('#seed')).toHaveValue('portal');
    await expect(page.locator('#grammar')).toHaveValue('quad-fold-v1');
    await expect(page.locator('#hash')).toHaveValue('sha256');
  });

  test('invalid permalink params fall back to defaults (never throws)', async ({ page }) => {
    await page.goto('/?grammar=evil&hash=md5&fg=url(%23x)');
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

  test('QR mode renders a QR and can be downloaded', async ({ page }) => {
    await page.goto('/');
    await page.check('#qr-toggle');
    await expect(page.locator('#qr-preview svg')).toBeVisible();
    const [download] = await Promise.all([page.waitForEvent('download'), page.click('#dl-qr')]);
    expect(download.suggestedFilename()).toMatch(/-qr\.png$/);
  });

  test('color and transparency changes are reflected in the SVG', async ({ page }) => {
    await page.goto('/');
    await page.check('#transparent');
    const svgHtml = await page.locator('#preview').innerHTML();
    expect(svgHtml).not.toContain('#ffffff');
  });
});
