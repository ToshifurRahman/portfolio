import { expect, test } from '@playwright/test';

/* Two defects the review found in R4a's motion, both of which measured clean in
   computed style and wrong on the screen — so both are tested by what a visitor
   sees, not by what a property reports.

   R4a-ds-1: the rail sat at `z-index: -1` inside a `body` that paints its own
   opaque background, so a negative-z child painted behind it. The pulse was
   running the whole time and never once appeared.

   R4a-ds-2: the hero cells were staggered by `--cell-index`, but nothing ever set
   it, so all eleven shared one delay and the wave switched on at once instead of
   travelling down the page.
 */

const THEMES = ['dark', 'light'] as const;

test.describe('the signature pulse actually paints', () => {
  for (const theme of THEMES) {
    test(`a lit strip changes the pixels (${theme})`, async ({ page }) => {
      await page.setViewportSize({ width: 834, height: 900 });
      await page.emulateMedia({ colorScheme: theme });
      await page.goto('/');
      await page.waitForTimeout(300);

      /* Force every strip visible and compare the rendered page with the same
         page with the rail hidden. If the rail is behind an opaque background the
         two images are identical, which is the defect. */
      await page.addStyleTag({
        content: `.site-rail i { animation: none !important; opacity: 1 !important; }`,
      });
      const withRail = await page.screenshot();

      await page.addStyleTag({ content: `.site-rail { display: none !important; }` });
      const withoutRail = await page.screenshot();

      expect(Buffer.compare(withRail, withoutRail), 'the rail paints nothing').not.toBe(0);
    });
  }

  test('the pulse is faint, not a stripe', async ({ page }) => {
    /* The owner's restraint rule: one faint ray, never a band. Compare a strip's
       own column against its neighbours at full opacity: the difference has to be
       small. */
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await page.addStyleTag({
      content: `.site-rail i { animation: none !important; opacity: 1 !important; }`,
    });

    const delta = await page.evaluate(() => {
      /* One lit strip against the page's own background, in the same column. */
      const strip = document.querySelector('.site-rail span i') as HTMLElement;
      const lit = getComputedStyle(strip).backgroundImage;
      return lit;
    });
    /* It paints something, and that something is a gradient rather than a solid
       fill: a solid fill at full opacity is the "band" the owner rejected. */
    expect(delta).toContain('gradient');
    expect(delta).not.toMatch(/^rgb\(/);
  });
});

test.describe('the hero wave travels', () => {
  test('at least three cells have different delays', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await page.locator('.intro').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);

    const delays = await page
      .locator('.hero-cell')
      .evaluateAll((cells) => cells.map((c) => getComputedStyle(c).animationDelay));

    expect(delays.length).toBeGreaterThanOrEqual(11);
    const distinct = new Set(delays);
    expect(distinct.size, `all cells share one delay: ${delays.join(', ')}`).toBeGreaterThanOrEqual(3);
    /* And the first cell is not delayed, so the wave starts where the name is. */
    expect(delays[0]).toBe('0s');
  });

  test('the delay runs in order, so the light moves down', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    await page.locator('.intro').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);

    const delays = await page
      .locator('.hero-cell')
      .evaluateAll((cells) => cells.map((c) => parseFloat(getComputedStyle(c).animationDelay)));

    /* A negative delay means each cell is already partway through the same cycle,
       so later cells are further along. Monotonic, not merely distinct. */
    for (let i = 1; i < delays.length; i++) {
      expect(delays[i], `cell ${i} is not offset from cell ${i - 1}`).not.toBe(delays[i - 1]);
    }
  });
});

test.describe('the pulse holds its restraint while scrolling', () => {
  test('pauses during a fast scroll and resumes when the page settles', async ({ page }) => {
    /* Ruling 4: the rail is fixed to the viewport, so "paused off-screen" is the
       hero's rule; for the rail it is the hidden tab and this one. */
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    await page.waitForTimeout(300);
    await expect.poll(() => page.evaluate(() => document.documentElement.dataset.motion)).toBe('on');

    await page.evaluate(() => window.scrollTo(0, 600));
    /* The scroll event is dispatched asynchronously, so the state lands a frame
       after the call, not inside it. */

    await expect.poll(() => page.evaluate(() => document.documentElement.dataset.motion)).toBe('scrolling');
    const play = await page
      .locator('.site-rail i')
      .first()
      .evaluate((el) => getComputedStyle(el).animationPlayState);
    expect(play).toBe('paused');

    /* And it comes back once the page is still. */
    await expect.poll(() => page.evaluate(() => document.documentElement.dataset.motion), {
      timeout: 3000,
    }).toBe('on');
  });

  test('the rail pauses on a hidden tab too', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(300);
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect.poll(() => page.evaluate(() => document.documentElement.dataset.motion)).toBe('paused');
    const play = await page
      .locator('.site-rail i')
      .first()
      .evaluate((el) => getComputedStyle(el).animationPlayState);
    expect(play).toBe('paused');
  });
});
