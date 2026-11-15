import { expect, test } from '@playwright/test';

test.describe('first screen at 390 px', () => {
  test('shows who this is, the statement, the CV and every figure above the fold', async ({ page }) => {
    /* Must-prove 2: the first viewport shows the name, the role and the Download
       CV action. The readout now carries two figures (owner, 2026-11-15 23:03:
       drop the open-source figure), so the count is read rather than
       hard-coded. */
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    for (const selector of ['.name', '.role', '.statement', '.readout .button']) {
      await expect(page.locator(selector)).toBeInViewport();
    }
    const figures = page.locator('.readout .proof li');
    expect(await figures.count()).toBe(2);
    for (const figure of await figures.all()) {
      await expect(figure).toBeInViewport({ ratio: 1 });
    }
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

  for (const width of [721, 768, 900, 1024, 1100, 1180]) {
    test(`the navbar stays one row at ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      const bar = await page.locator('.navbar').boundingBox();
      expect(bar!.height).toBeLessThan(70);
    });
  }

  /* R3-ds-3: between 769 and 809px the full bar did not fit — `.nav-tools` ended
     at 791px in a 769px viewport, so the theme toggle was clipped and the page
     scrolled 22px sideways. The fix is not to squeeze the bar but to collapse it
     into the Menu button earlier, at the width where the full bar actually fits.
     The CV action has to stay reachable either way (Must prove 2). */
  for (const width of [769, 800, 810, 832, 1024]) {
    test(`nothing clips or scrolls sideways at ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      const fit = await page.evaluate(() => {
        const toggle = document.querySelector<HTMLElement>('.theme-toggle')!;
        const box = toggle.getBoundingClientRect();
        return {
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          toggleRight: Math.round(box.right),
          toggleShown: toggle.getClientRects().length > 0,
          client: document.documentElement.clientWidth,
        };
      });
      expect(fit.toggleShown).toBe(true);
      expect(fit.overflow, `page scrolls sideways at ${width}px`).toBeLessThanOrEqual(0);
      expect(fit.toggleRight).toBeLessThanOrEqual(fit.client + 1);
    });
  }

  /* Whichever layout the bar is in, the CV download exists and is reachable:
     in the bar where the bar is full, in the menu where it has collapsed. */
  for (const width of [390, 769, 800, 810, 832, 1024, 1280]) {
    test(`the CV action is reachable at ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      const inBar = page.locator('.nav-tools .cv-link');
      const collapsed = await page.getByRole('button', { name: /menu/i }).isVisible();
      if (collapsed) {
        await expect(inBar).toBeHidden();
        await page.getByRole('button', { name: /menu/i }).click();
        await expect(page.locator('#primary-menu .nav-cv a')).toBeVisible();
      } else {
        await expect(inBar).toBeVisible();
      }
      /* And always in the hero, which is Must prove 2. */
      await expect(page.locator('.readout .button')).toBeVisible();
    });
  }

  test('390 px: the bar fits one row and the menu carries the CV download', async ({ page }) => {
    /* This used to inject a .cv-link when one was missing, so it passed while
       the shipped bar hid the button and the open menu offered no CV, no email
       and no LinkedIn on a case study. It now asserts what ships. */
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/work/ticket-pipeline');

    const fit = await page.evaluate(() => {
      const bar = document.querySelector('.navbar') as HTMLElement;
      /* No CV button is fabricated: at 390 the bar hides the real one. */
      const tools = document.querySelector('.nav-tools') as HTMLElement;
      const button = tools.querySelector<HTMLElement>('.cv-link');
      return {
        height: bar.getBoundingClientRect().height,
        buttonShown: !!button && button.getClientRects().length > 0,
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      };
    });
    expect(fit.height).toBeLessThan(70);
    expect(fit.scroll).toBeLessThanOrEqual(fit.client);
    /* The bar keeps fitting because the button is not in it on a phone. */
    expect(fit.buttonShown).toBe(false);

    /* And the CV is reachable: opening the menu offers it, as a download. */
    await page.getByRole('button', { name: /menu/i }).click();
    const cv = page.locator('#primary-menu').getByRole('link', { name: /download cv/i });
    await expect(cv).toBeVisible();
    await expect(cv).toHaveAttribute('href', /\.pdf$/);
    await expect(cv).toHaveAttribute('download', /.*/);
    /* The menu does not push the bar to a second row either. */
    const afterOpen = await page.evaluate(() => {
      const bar = document.querySelector('.navbar') as HTMLElement;
      return { scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth, width: bar.getBoundingClientRect().width };
    });
    expect(afterOpen.scroll).toBeLessThanOrEqual(afterOpen.client);
  });

  test('390 px: no CV row is duplicated on the home page menu', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.getByRole('button', { name: /menu/i }).click();
    await expect(page.locator('#primary-menu .nav-cv')).toHaveCount(1);
    /* The bar's own button stays out of the layout, so the download exists once. */
    await expect(page.locator('.navbar a[download].button')).toBeHidden();
  });

  test('390 px: a contents link clears the sticky contents row', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/work/ticket-pipeline');
    await page.locator('.contents a', { hasText: 'Problem' }).click();
    await expect
      .poll(async () =>
        page.evaluate(() => {
          const heading = document.getElementById('problem-h')!.getBoundingClientRect().top;
          const bar = document.querySelector('.contents')!.getBoundingClientRect().bottom;
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

test.describe('case-study contents', () => {
  const pages = ['/work/ticket-pipeline', '/work/rannaghor'];

  test('shows all seven steps, unclipped, inside the column at 1280 px', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    for (const path of pages) {
      await page.goto(path);
      const links = page.locator('.contents a');
      await expect(links).toHaveCount(7);
      for (const link of await links.all()) await expect(link).toBeInViewport();
      expect((await links.last().textContent())!.trim()).toBe('Results');
      const clipped = await links.evaluateAll((all) => all.some((el) => el.scrollWidth > el.clientWidth + 1));
      expect(clipped).toBe(false);
      /* No sidebar: the list runs across the frame, between its two rules. */
      const list = await page.locator('.contents ol').boundingBox();
      const frame = await page.locator('.study-head').boundingBox();
      expect(list!.x).toBeGreaterThanOrEqual(frame!.x - 1);
      expect(list!.x + list!.width).toBeLessThanOrEqual(frame!.x + frame!.width + 1);
    }
  });

  test('a contents link clears the two-row contents bar at 1280 px', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/work/ticket-pipeline');
    await page.locator('.contents a', { hasText: 'Challenges' }).click();
    await expect
      .poll(async () =>
        page.evaluate(() => {
          const heading = document.getElementById('challenges-h')!.getBoundingClientRect().top;
          const bar = document.querySelector('.contents')!.getBoundingClientRect().bottom;
          return Math.round(heading - bar);
        }),
      )
      .toBeGreaterThanOrEqual(-1);
  });

  test('narrow widths keep a visible scroll cue', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/work/ticket-pipeline');
    const cue = await page.locator('.contents ol').evaluate((el) => {
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
    const current = page.locator('.contents a[aria-current]');
    await expect(current).toBeVisible();
    const gap = await page.locator('.contents ol').evaluate((el) => {
      const item = el.querySelector('a[aria-current]') as HTMLElement | null;
      if (!item) return 99;
      return item.getBoundingClientRect().left - el.getBoundingClientRect().left;
    });
    expect(gap).toBeGreaterThanOrEqual(0);
  });
});

test.describe('the wordmark is never broken to fit', () => {
  /* Between 833 and 906px the bar used to fit by wrapping `.brand` to two lines:
     "Toshifur" / "Rahman" in the sticky header, with slack sitting unused beside
     it. A name broken across lines in the header is not a smaller version of the
     design, so the bar collapses instead. */
  for (const width of [833, 850, 880, 906, 907, 1024]) {
    test(`one-line wordmark, no overflow and the toggle inside at ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');

      const brand = await page.locator('.brand').evaluate((el) => {
        /* The anchor carries min-height (the tap target), so its box height says
           nothing about wrapping. The text's own client rects do: a Range over
           the contents returns one rect per line box the text occupies. */
        const range = document.createRange();
        range.selectNodeContents(el);
        const lines = Array.from(range.getClientRects()).filter((r) => r.width > 1);
        return { tops: [...new Set(lines.map((r) => Math.round(r.top)))].length };
      });
      expect(brand.tops, 'the wordmark wrapped to more than one line').toBe(1);

      const page_ = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      }));
      expect(page_.scroll).toBeLessThanOrEqual(page_.client);

      /* The theme toggle is fully inside the viewport, not clipped by the edge. */
      const toggle = await page.locator('.nav-tools button').first().boundingBox();
      expect(toggle).not.toBeNull();
      expect(toggle!.x + toggle!.width).toBeLessThanOrEqual(page_.client + 0.5);

      /* And the CV action is reachable at this width, in the bar or in the menu. */
      const inBar = await page.locator('.cv-link').isVisible();
      if (!inBar) {
        await page.locator('.menu-button').click();
        await expect(page.locator('.nav-links a', { hasText: /CV|Download/i }).first()).toBeVisible();
      }
    });
  }
});
