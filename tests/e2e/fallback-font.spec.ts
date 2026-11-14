import { expect, test } from '@playwright/test';

/*
 * The web font is `font-display: optional`, so a cold visit that misses it
 * paints the whole page in the fallback face and never swaps. The layout must
 * be the same either way: the fallback is metric-matched, and nothing may be
 * clipped or pushed onto a second row when the face does not arrive.
 *
 * Every test here aborts the woff2 request, which is the worst case (the face
 * never arrives at all), and checks the same things the font-loaded layout
 * tests check.
 */
const blockFont = (page: import('@playwright/test').Page) => page.route('**/*.woff2', (route) => route.abort());

const measure = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const doc = document.documentElement;
    const name = document.querySelector('.name') as HTMLElement;
    const bar = document.querySelector('.navbar') as HTMLElement;
    const chain = document.querySelector('.chain-states') as HTMLElement;
    const last = document.querySelector('.chain-state:last-child') as HTMLElement;
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      nameClipped: name.scrollWidth - name.clientWidth,
      barHeight: Math.round(bar.getBoundingClientRect().height),
      /* The chain scrolls by design below 62rem; above it, every box must fit. */
      chainOverflow: chain.scrollWidth - chain.clientWidth,
      lastRight: Math.round(last.getBoundingClientRect().right),
      chainRight: Math.round(chain.getBoundingClientRect().right),
    };
  });

for (const theme of ['dark', 'light'] as const) {
  for (const width of [390, 1280]) {
    test(`fallback font, ${width} px ${theme}: no overflow and a one-row bar`, async ({ page }) => {
      await blockFont(page);
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await page.goto('/');
      /* The face is blocked, so the fallback is what is painted; wait for the
         page to settle rather than for a font that will never load. */
      await expect(page.locator('.name')).toBeVisible();

      const m = await measure(page);
      expect(m.scrollWidth, 'the page overflows horizontally').toBeLessThanOrEqual(m.clientWidth);
      expect(m.nameClipped, 'the name is clipped').toBeLessThanOrEqual(0);
      expect(m.barHeight, 'the navbar wrapped to a second row').toBeLessThan(70);
      if (width === 1280) {
        expect(m.chainOverflow, 'the chain overflows at 1280').toBeLessThanOrEqual(0);
        expect(m.lastRight).toBeLessThanOrEqual(m.chainRight + 1);
      }
    });
  }
}

test('fallback font: the case study page does not overflow either', async ({ page }) => {
  await blockFont(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/work/ticket-pipeline');
  await expect(page.locator('.study-title')).toBeVisible();
  const m = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    barHeight: Math.round((document.querySelector('.navbar') as HTMLElement).getBoundingClientRect().height),
  }));
  expect(m.scrollWidth).toBeLessThanOrEqual(m.clientWidth);
  expect(m.barHeight).toBeLessThan(70);
});

test('fallback font: the page is still usable', async ({ page }) => {
  await blockFont(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  /* Hydration and the theme switch do not depend on the face. */
  await page.getByRole('radio', { name: 'Light' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('link', { name: 'Skills' }).click();
  await expect(page.locator('#skills')).toBeInViewport();
});
