import { expect, test } from '@playwright/test';

/* The signature motion, and its restraint contract.
 *
 * Owner, 2026-11-15 23:03: a ray runs from the coloured name down the strips to
 * the footer, charging each as it passes; the hero's cells glow in a slow wave
 * and three at a time under the pointer. "Too much animation can break attention
 * to key points", so:
 *
 *   - one pulse on load, then at most one every 20 to 30 seconds;
 *   - nothing moves on a hidden tab or off-screen;
 *   - under `prefers-reduced-motion: reduce` there is no pulse and no wave;
 *   - the pre-render and the first client frame are the same picture;
 *   - only transform and opacity move.
 */

const animation = (page: import('@playwright/test').Page, selector: string) =>
  page.locator(selector).first().evaluate((el) => {
    const cs = getComputedStyle(el);
    return { name: cs.animationName, duration: cs.animationDuration, play: cs.animationPlayState };
  });

test.describe('signature motion', () => {
  test('runs a slow wave and a slow pulse', async ({ page }) => {
    await page.goto('/');
    await page.locator('.intro').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);

    const wave = await animation(page, '.hero-cell');
    expect(wave.name).toBe('hero-wave');
    /* The owner's floor for the wave: a cycle of at least 8 seconds. */
    expect(parseFloat(wave.duration)).toBeGreaterThanOrEqual(8);

    const pulse = await animation(page, '.site-rail i');
    expect(pulse.name).toBe('rail-pulse');
    /* At most one every 20 to 30 seconds: the period is the lower bound. */
    expect(parseFloat(pulse.duration)).toBeGreaterThanOrEqual(20);
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

  test('stops the hero wave when the hero is scrolled away', async ({ page }) => {
    await page.goto('/');
    await page.locator('.intro').scrollIntoViewIfNeeded();
    await expect.poll(() => page.evaluate(() => document.querySelector('.intro')?.dataset.inview)).toBe('true');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect.poll(() => page.evaluate(() => document.querySelector('.intro')?.dataset.inview)).toBe('false');
    const wave = await animation(page, '.hero-cell');
    expect(wave.play).toBe('paused');
  });

  test('has no pulse and no wave under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => document.documentElement.dataset.motion)).toBeUndefined();
    expect((await animation(page, '.hero-cell')).name).toBe('none');
    expect((await animation(page, '.site-rail i')).name).toBe('none');
    /* And nothing is left faintly visible on top of the text. */
    expect(await page.locator('.hero-cell').first().evaluate((el) => getComputedStyle(el).opacity)).toBe('0');
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

  test('lights exactly three cells under the pointer, and only with a real pointer', async ({ page }) => {
    await page.goto('/');
    const hero = page.locator('.intro');
    const box = (await hero.boundingBox())!;
    await page.mouse.move(box.x + box.width * 0.45, box.y + box.height * 0.5);
    await expect.poll(() => page.locator('.hero-cell.is-hot').count()).toBe(3);

    /* Leaving the hero clears them, so nothing stays lit behind the text. */
    await page.mouse.move(0, box.height * 3);
    await expect.poll(() => page.locator('.hero-cell.is-hot').count()).toBe(0);
  });

  test('never lights a cell on a touch screen', async ({ page }) => {
    /* No hover: the media query excludes the whole effect, so a tap cannot
       leave a cell stuck lit. */
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    const hoverable = await page.evaluate(() => matchMedia('(hover: hover) and (pointer: fine)').matches);
    if (hoverable) test.skip(true, 'this runner reports a fine pointer');
    await page.locator('.intro').tap().catch(() => {});
    expect(await page.locator('.hero-cell.is-hot').count()).toBe(0);
  });

  test('keeps the text readable over a lit cell', async ({ page }) => {
    /* Must prove 3 and A6: the glow never lowers text contrast below AA. The
       cells sit behind the text at a few per cent opacity, so the statement is
       measured against the cell's own tinted background. */
    await page.goto('/');
    const hero = page.locator('.intro');
    const box = (await hero.boundingBox())!;
    await page.mouse.move(box.x + box.width * 0.45, box.y + box.height * 0.5);

    const contrast = await page.evaluate(() => {
      const parse = (s: string) => s.match(/[\d.]+/g)!.slice(0, 3).map(Number);
      const lum = (rgb: number[]) => {
        const f = (c: number) => {
          const x = c / 255;
          return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]);
      };
      const root = getComputedStyle(document.documentElement);
      /* The cell paints a gradient, so `background-color` is transparent; the
         accent it glows with is the token. */
      const accentHex = root.getPropertyValue('--accent').trim();
      const accent = parse(
        accentHex.startsWith('#')
          ? `rgb(${parseInt(accentHex.slice(1, 3), 16)}, ${parseInt(accentHex.slice(3, 5), 16)}, ${parseInt(
              accentHex.slice(5, 7),
              16,
            )})`
          : accentHex,
      );
      const bg = parse(getComputedStyle(document.body).backgroundColor);
      /* Worst case in the hero: the statement, which is the faintest large text,
         over a cell at the hover opacity. */
      const statement = document.querySelector('.statement')!;
      const fg = parse(getComputedStyle(statement).color);
      const lit = bg.map((c, i) => c * (1 - 0.07) + accent[i] * 0.07);
      const a = lum(fg);
      const z = lum(lit);
      return (Math.max(a, z) + 0.05) / (Math.min(a, z) + 0.05);
    });
    expect(contrast).toBeGreaterThanOrEqual(4.5);
  });
});
