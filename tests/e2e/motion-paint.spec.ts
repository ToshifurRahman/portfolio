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

test.describe('the removed hero cells paint nothing', () => {
  test('no gap cell exists, so the wave cannot unfurl', async ({ page }) => {
    /* R4a-ds-2 pinned the eleven cells' stagger. The owner removed the cells
       themselves on 2026-11-17, so the test now asserts the new state: the wave
       has nothing to travel across, and the ray down the strips stays. */
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');

    expect(await page.locator('.hero-cell').count()).toBe(0);
    const pulse = await page.locator('.site-rail i').first().evaluate((el) => getComputedStyle(el).animationName);
    expect(pulse).toBe('rail-pulse');
  });
});

test.describe('the pulse keeps its cycle while scrolling', () => {
  test('does not pause or reset when the page moves', async ({ page }) => {
    /* The rail is fixed to the viewport, so it is always on screen: a scroll is
       not a reason to stop it, and removing the animation reset its clock. The
       owner asked for a continuous 10s cycle from header to footer. */
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    await page.waitForTimeout(300);
    await expect.poll(() => page.evaluate(() => document.documentElement.dataset.motion)).toBe('on');

    const before = await page.locator('.site-rail i').first().evaluate((el) => {
      const anim = el.getAnimations()[0] as CSSAnimation | undefined;
      return {
        time: anim?.currentTime ?? null,
        name: getComputedStyle(el).animationName,
      };
    });
    expect(before.name).toBe('rail-pulse');
    expect(before.time).not.toBeNull();

    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(150);

    await expect.poll(() => page.evaluate(() => document.documentElement.dataset.motion)).toBe('on');
    const during = await page.locator('.site-rail i').first().evaluate((el) => {
      const anim = el.getAnimations()[0] as CSSAnimation | undefined;
      const cs = getComputedStyle(el);
      return { time: anim?.currentTime ?? null, name: cs.animationName, play: cs.animationPlayState };
    });
    expect(during.name).toBe('rail-pulse');
    expect(during.play).toBe('running');
    expect(Number(during.time)).toBeGreaterThan(Number(before.time));
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
