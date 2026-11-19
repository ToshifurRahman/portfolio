import { expect, test } from '@playwright/test';

/* Owner, 2026-11-17: "in hero, remove animations & colors on strip gaps" and
   the ruling that the orange ray down the strips stays. The column hairlines
   are still there; only the boxes in the gaps are gone. */

test.describe('the hero has no gap cells', () => {
  test('renders no gap cell and no wave container', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    await expect(page.locator('.hero-cells')).toHaveCount(0);
    await expect(page.locator('.hero-cell')).toHaveCount(0);
    /* The column lines the cells used to sit between are untouched. */
    await expect(page.locator('.gridlines > span')).toHaveCount(12);
  });

  test('keeps the orange ray down the strips', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForTimeout(400);

    await expect(page.locator('.site-rail span')).toHaveCount(12);
    const pulse = await page.locator('.site-rail i').first().evaluate((el) => {
      const cs = getComputedStyle(el);
      return { name: cs.animationName, duration: cs.animationDuration };
    });
    expect(pulse.name).toBe('rail-pulse');
    expect(parseFloat(pulse.duration)).toBe(10);
  });

  test('under reduced motion there is no cell and the ray holds still', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForTimeout(300);

    await expect(page.locator('.hero-cell')).toHaveCount(0);
    const pulse = await page.locator('.site-rail i').first().evaluate((el) => getComputedStyle(el).animationName);
    expect(pulse).toBe('none');
  });
});
