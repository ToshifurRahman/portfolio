import { expect, test } from '@playwright/test';

/* The Now panel's two cells — "Latest system" and "Problem solving" — are short
   one-line facts. Side by side they make a 1024-wide row twice as useful; stacked,
   each got a full-width row for one line and the panel grew far taller at 1024
   than at 1280. They sit two-across from 48rem up and stack on a phone. */

const cells = ['.now-cells > div:first-child', '.now-cells > div:last-child'];

test.describe('the Now cells share a row where there is room', () => {
  for (const width of [769, 800, 1024]) {
    test(`both cells sit on one row at ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      await page.locator('#now').scrollIntoViewIfNeeded();

      const boxes = [];
      for (const selector of cells) {
        const box = await page.locator(selector).boundingBox();
        expect(box, `${selector} is not visible`).not.toBeNull();
        boxes.push(box!);
      }
      const [a, b] = boxes;
      /* Same row: their vertical spans overlap by most of the shorter one. */
      const overlap = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
      expect(overlap).toBeGreaterThan(Math.min(a.height, b.height) * 0.8);
      /* And side by side, not one above the other. */
      expect(Math.abs(a.y - b.y)).toBeLessThan(4);
      expect(b.x).toBeGreaterThan(a.x);
    });
  }

  test('they stack on a phone at 390 px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.locator('#now').scrollIntoViewIfNeeded();

    const first = await page.locator(cells[0]).boundingBox();
    const second = await page.locator(cells[1]).boundingBox();
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    /* One above the other: the second starts at or below the first one's bottom. */
    expect(second!.y).toBeGreaterThanOrEqual(first!.y + first!.height - 1);
  });
});
