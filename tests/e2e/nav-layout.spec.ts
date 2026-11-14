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

test.describe('design review 1 regressions', () => {
  for (const theme of ['dark', 'light'] as const) {
    test(`390 px ${theme}: the home page has no horizontal overflow`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto('/');
      const width = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      }));
      expect(width.scroll).toBeLessThanOrEqual(width.client);
    });
  }

  test('1280 px: every state label fits inside its box', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    const over = await page.locator('.chain-state').evaluateAll((boxes) =>
      boxes
        .map((box) => ({ text: box.textContent?.trim(), by: box.scrollWidth - box.clientWidth }))
        .filter((box) => box.by > 0),
    );
    expect(over).toEqual([]);
  });

  for (const width of [721, 768, 900, 1024, 1100, 1180]) {
    test(`the navbar stays one row at ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      const bar = await page.locator('.navbar').boundingBox();
      expect(bar!.height).toBeLessThan(70);
    });
  }

  test('390 px: the bar still fits one row with the CV link in place', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const fit = await page.evaluate(() => {
      /* owner.cv is empty until cv-content lands, so the link the navbar will
         render is measured here instead of waiting for that branch. */
      const tools = document.querySelector('.nav-tools')!;
      const cv = document.createElement('a');
      cv.className = 'cv-link';
      cv.href = '/cv.pdf';
      cv.textContent = 'CV';
      tools.prepend(cv);
      const bar = document.querySelector('.navbar') as HTMLElement;
      const brand = document.querySelector('.brand') as HTMLElement;
      const menu = document.querySelector('.menu-button') as HTMLElement;
      const picker = document.querySelector('.theme-picker') as HTMLElement;
      return {
        height: bar.getBoundingClientRect().height,
        crowded: menu.getBoundingClientRect().right - brand.getBoundingClientRect().left,
        overlap: cv.getBoundingClientRect().right - picker.getBoundingClientRect().left,
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      };
    });
    expect(fit.height).toBeLessThan(70);
    expect(fit.overlap).toBeLessThanOrEqual(0);
    expect(fit.scroll).toBeLessThanOrEqual(fit.client);
  });

  test('390 px: a step link clears the sticky progress bar', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/work/ticket-pipeline');
    await page.locator('.progress a', { hasText: 'Problem' }).click();
    await expect
      .poll(async () =>
        page.evaluate(() => {
          const heading = document.getElementById('problem-h')!.getBoundingClientRect().top;
          const bar = document.querySelector('.progress')!.getBoundingClientRect().bottom;
          return Math.round(heading - bar);
        }),
      )
      .toBeGreaterThanOrEqual(-1);
  });

  test('the focused skip link is on top of the sticky header', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skip = page.locator('.skip');
    await expect(skip).toBeFocused();
    const top = await skip.evaluate((el) => {
      const box = el.getBoundingClientRect();
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      return { isSkip: el === hit || el.contains(hit), top: Math.round(box.top) };
    });
    expect(top.isSkip).toBe(true);
    expect(top.top).toBeGreaterThanOrEqual(0);
  });

  test('the brand link is at least a 24 px target', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    const box = await page.locator('.brand').boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(24);
    expect(box!.width).toBeGreaterThanOrEqual(24);
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
