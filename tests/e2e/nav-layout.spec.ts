import { expect, test } from '@playwright/test';

test.describe('first screen at 390 px', () => {
  test('shows who this is and the first section above the fold', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.locator('.name')).toBeInViewport();
    await expect(page.locator('.mast-role')).toBeInViewport();
    await expect(page.locator('#about-title')).toBeInViewport();
    const box = await page.locator('#about-title').boundingBox();
    expect(box!.y).toBeLessThan(844);
  });

  test('the state diagram stays a strip instead of a column', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const strip = await page.locator('.chain-states').boundingBox();
    /* Seven stacked rows would be over 400 px tall; a strip is one or two rows. */
    expect(strip!.height).toBeLessThan(180);
  });
});

test.describe('case-study step chain', () => {
  const pages = ['/work/ticket-pipeline', '/work/rannaghor'];

  test('fits all nine steps and both terminals at 1280 px', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    for (const path of pages) {
      await page.goto(path);
      const metrics = await page.locator('.progress').evaluate((el) => {
        const list = el.querySelector('ol')!;
        return {
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
          listScroll: list.scrollWidth,
          listClient: list.clientWidth,
        };
      });
      expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
      expect(metrics.listScroll).toBeLessThanOrEqual(metrics.listClient);

      const last = page.locator('.progress a').last();
      await expect(last).toBeInViewport();
      const text = (await last.textContent())!.trim();
      expect(text).toBe('09 Future');
      const clipped = await last.evaluate((el) => el.scrollWidth > el.clientWidth + 1);
      expect(clipped).toBe(false);
    }
  });

  test('narrow widths keep a visible scroll cue', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/work/ticket-pipeline');
    const cue = await page.locator('.progress ol').evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        overflowX: style.overflowX,
        scrollable: el.scrollWidth > el.clientWidth,
        scrollbarWidth: style.scrollbarWidth,
      };
    });
    expect(cue.overflowX).toBe('auto');
    if (cue.scrollable) expect(cue.scrollbarWidth).not.toBe('none');
  });

  test('the current step never sits flush against the left edge', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/work/ticket-pipeline');
    await page.locator('#results').scrollIntoViewIfNeeded();
    const current = page.locator('.progress a[aria-current]');
    await expect(current).toBeVisible();
    const gap = await page.locator('.progress ol').evaluate((el) => {
      const item = el.querySelector('a[aria-current]') as HTMLElement | null;
      if (!item) return 99;
      return item.getBoundingClientRect().left - el.getBoundingClientRect().left;
    });
    expect(gap).toBeGreaterThan(0);
  });
});
