import { expect, test } from '@playwright/test';

/* The Now panel's two-lane timeline. This replaces two specs whose subject the
   owner removed on 2026-11-15: `now-cells.spec.ts` tested the "Latest system" and
   "Problem solving" cells, and `now-path.spec.ts` tested the single rail of
   eight stations. Both are gone, so the tests that pinned them are gone with
   them rather than left failing against markup that no longer exists. */

const WIDTHS = [360, 390, 430, 768, 1024, 1280, 1600];

test.describe('the Now timeline', () => {
  for (const width of WIDTHS) {
    test(`has no overlapping label at ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      await page.locator('#now').scrollIntoViewIfNeeded();

      const result = await page.evaluate(() => {
        const labels = [...document.querySelectorAll('#now .stop-label, #now .stop-date, #now .stop-child')]
          .map((el) => ({ text: (el.textContent ?? '').trim(), rect: el.getBoundingClientRect() }))
          .filter((o) => o.rect.width > 1);
        const overlaps: string[] = [];
        for (let i = 0; i < labels.length; i++) {
          for (let j = i + 1; j < labels.length; j++) {
            const a = labels[i].rect;
            const b = labels[j].rect;
            /* Both axes: comparing one axis reports false collisions wherever a
               layout deliberately shares it. */
            if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) {
              overlaps.push(`${labels[i].text} | ${labels[j].text}`);
            }
          }
        }
        const panel = document.querySelector('#now')!.getBoundingClientRect();
        const spill = labels.filter((o) => o.rect.right > panel.right + 1).map((o) => o.text);
        const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
        return { overlaps, spill, overflow };
      });

      expect(result.overlaps, `labels overlapping at ${width}px`).toEqual([]);
      expect(result.spill, `labels past the panel at ${width}px`).toEqual([]);
      expect(result.overflow).toBeLessThanOrEqual(0);
    });
  }

  test('shows two lanes and no cells', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    await expect(page.locator('#now .tl-lane-title')).toHaveText(['Study', 'Work']);
    await expect(page.locator('#now .now-cell')).toHaveCount(0);
  });

  test('puts a dated stop in its year column and lists an undated role under its parent', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    await expect(page.locator('#now .years li')).toHaveText(['2021', '2023', '2025', '2026']);
    /* A dated stop claims a column; the two undated roles hang beneath Trainer
       & Mentor rather than being pinned to a year nobody stated. */
    const children = page.locator('#now .stop-child');
    await expect(children).toHaveCount(2);
    await expect(children.first()).toContainText('Bootcamp Coordinator');
  });

  test('stacks into one vertical timeline on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.locator('#now').scrollIntoViewIfNeeded();
    /* The year ticks have no room to be an axis here, so they give way and each
       stop takes its own row. */
    await expect(page.locator('#now .years')).toBeHidden();
    const columns = await page.locator('#now .tl-stops').evaluateAll((lists) =>
      lists.map((l) => getComputedStyle(l).flexDirection),
    );
    expect(columns.every((d) => d === 'column')).toBe(true);
  });
});
