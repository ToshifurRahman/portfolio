import { expect, test } from '@playwright/test';

/* The signature motion, and its restraint contract.
 *
 * The owner asked for a ray from the coloured name down the strips to the
 * footer, charging each as it passes. On 2026-11-17 he removed the hero's gap
 * cells ("in hero, remove animations & colors on strip gaps") and kept the ray:
 *
 *   - one pulse on load, then one every 10 seconds;
 *   - scrolling neither pauses nor restarts it;
 *   - nothing moves on a hidden tab;
 *   - under `prefers-reduced-motion: reduce` there is no pulse;
 *   - the pre-render and the first client frame are the same picture;
 *   - only transform and opacity move.
 *
 * The wave tests that pinned the removed hero cells are gone; the no-cells
 * promise is asserted in hero-gap.spec.ts. */

const animation = (page: import('@playwright/test').Page, selector: string) =>
  page.locator(selector).first().evaluate((el) => {
    const cs = getComputedStyle(el);
    return { name: cs.animationName, duration: cs.animationDuration, play: cs.animationPlayState };
  });

test.describe('signature motion', () => {
  test('runs a 10s pulse down the strips', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(400);

    const pulse = await animation(page, '.site-rail i');
    expect(pulse.name).toBe('rail-pulse');
    expect(parseFloat(pulse.duration)).toBe(10);
  });

  test('keeps running through a scroll, without resetting', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(400);

    const state = () =>
      page.locator('.site-rail i').first().evaluate((el) => {
        const anim = el.getAnimations()[0] as CSSAnimation | undefined;
        const cs = getComputedStyle(el);
        return {
          motion: document.documentElement.dataset.motion ?? null,
          name: cs.animationName,
          play: cs.animationPlayState,
          time: anim?.currentTime ?? null,
        };
      });

    const before = await state();
    expect(before.motion).toBe('on');
    expect(before.name).toBe('rail-pulse');
    expect(before.time).not.toBeNull();

    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(150);

    const during = await state();
    /* The scroll must not change the state, and it must not restart the clock. */
    expect(during.motion).toBe('on');
    expect(during.name).toBe('rail-pulse');
    expect(during.play).toBe('running');
    expect(Number(during.time)).toBeGreaterThan(Number(before.time));
  });

  test('staggers the strips, so the charge crosses the page', async ({ page }) => {
    await page.goto('/');
    const delays = await page.locator('.site-rail i').evaluateAll((strips) =>
      strips.map((s) => getComputedStyle(s).animationDelay),
    );
    expect(delays[0]).toBe('0s');
    /* Not all the same: the strip index drives the delay. */
    expect(new Set(delays).size).toBeGreaterThan(3);
    expect(parseFloat(delays[delays.length - 1])).toBeGreaterThan(parseFloat(delays[1]));
  });

  test('moves nothing while the tab is hidden', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(300);
    /* The page reports itself hidden, which is the state a background tab is in. */
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect
      .poll(() => page.evaluate(() => document.documentElement.dataset.motion))
      .toBe('paused');
    const pulse = await animation(page, '.site-rail i');
    expect(pulse.play).toBe('paused');
  });

  test('has no pulse under reduced motion, and no cells to wave', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => document.documentElement.dataset.motion)).toBeUndefined();
    expect((await animation(page, '.site-rail i')).name).toBe('none');
    expect(await page.locator('.hero-cell').count()).toBe(0);
  });

  test('colours the name, which is where the charge comes from', async ({ page }) => {
    /* The dark theme explicitly: a headless context with no colour-scheme
       preference reports light, and the accent-text differs between them. */
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    const name = await page.locator('.brand').evaluate((el) => getComputedStyle(el).color);
    const accentText = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--accent-text').trim(),
    );
    const ink = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--ink').trim(),
    );
    /* The accent, not the ink: the name is the one coloured thing in the bar. */
    expect(name).not.toBe(ink);
    expect(name.replace(/\s/g, '')).toBe('rgb(255,179,64)');
    expect(accentText).toBeTruthy();
  });
});
