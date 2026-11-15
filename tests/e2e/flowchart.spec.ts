import { expect, test, type Page } from '@playwright/test';

/*
 * The case studies' flowcharts. Must-prove 3, as amended by A5 and A6: the
 * diagram pauses off-screen and on a hidden tab, has a visible pause control, and
 * shows a complete still under reduced motion and in the pre-render. A6 adds that
 * it takes the full width and up to the full height, and that below 48rem the
 * graph reflows top to bottom instead of shrinking to unreadable text.
 *
 * This replaces the R2 framing-band spec, which framed one station at a time from
 * a wide track. What it must not do is lose the checks that spec had: the
 * pre-render without JavaScript, pause *and resume*, resuming after being
 * off-screen or in a hidden tab, one state on the pause control rather than two,
 * and no animated diagram left on the home page. Those are restored below
 * (R4b-agy-4), because an engine rewrite runs under them or it does not run.
 */

const DIAGRAMS = [
  {
    slug: 'ticket-pipeline',
    path: '/work/ticket-pipeline',
    status: /Completed/,
    done: ['react', 'api', 'queue', 'worker', 'gateway', 'primary', 'queued', 'triaging', 'drafting', 'completed'],
  },
  {
    slug: 'rannaghor',
    path: '/work/rannaghor',
    status: /Order committed/,
    done: ['security', 'rate', 'session', 'role', 'handler', 'postgres', 'tx'],
  },
];

const panel = (page: Page, slug: string) => page.locator(`.flow-panel[data-diagram="${slug}"]`);

/* The diagram sits at the top of a case study's Architecture section, not in the
   first viewport, so a test that wants motion has to bring it into view first. */
const reveal = async (page: Page, slug: string) => {
  await panel(page, slug).scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
};

/* The token's position, which is the one thing that says whether the clock runs. */
const marker = async (page: Page, slug: string) =>
  (await page.locator(`.flow-panel[data-diagram="${slug}"] .flow-h .flow-token`).getAttribute('transform')) ?? '';

/* Wait until the token has actually moved, so a "paused" check is not fooled by
   sampling before the first frame. */
const moved = async (page: Page, slug: string, from: string) => {
  await expect.poll(async () => (await marker(page, slug)) !== from, { timeout: 6000 }).toBe(true);
};

for (const d of DIAGRAMS) {
  test.describe(`${d.slug}: the pause control`, () => {
    test('stops the request, then lets it run again', async ({ page }) => {
      await page.goto(d.path);
      await reveal(page, d.slug);
      const pause = panel(page, d.slug).getByRole('button', { name: /pause the diagram/i });
      await expect(pause).toBeVisible();

      const before = await marker(page, d.slug);
      await moved(page, d.slug, before);

      await pause.click();
      await expect(panel(page, d.slug).getByRole('button', { name: /play the diagram/i })).toBeVisible();
      const held = await marker(page, d.slug);
      await page.waitForTimeout(700);
      expect(await marker(page, d.slug), 'the token kept moving while paused').toBe(held);

      /* And it resumes, which is the half the R4b rewrite lost. */
      await panel(page, d.slug).getByRole('button', { name: /play the diagram/i }).click();
      await expect.poll(async () => (await marker(page, d.slug)) !== held, { timeout: 6000 }).toBe(true);
    });

    test('names its state once, not twice', async ({ page }) => {
      /* The label already flips Pause/Play: an `aria-pressed` on top of it makes a
         screen reader say "Play the diagram, pressed". */
      await page.goto(d.path);
      const button = panel(page, d.slug).locator('.flow-pause');
      await expect(button).toHaveCount(1);
      await expect(button).not.toHaveAttribute('aria-pressed', /.*/);
    });
  });

  test.describe(`${d.slug}: the request rests when nothing is watching`, () => {
    test('holds while the panel is off-screen, and runs again in view', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 700 });
      await page.goto(d.path);
      await reveal(page, d.slug);
      const before = await marker(page, d.slug);
      await moved(page, d.slug, before);

      /* The Results section is far below the Architecture one. */
      await page.locator('#results').scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      const parked = await marker(page, d.slug);
      await page.waitForTimeout(700);
      expect(await marker(page, d.slug), 'the token ran while off-screen').toBe(parked);

      await panel(page, d.slug).scrollIntoViewIfNeeded();
      await expect
        .poll(async () => (await marker(page, d.slug)) !== parked, { timeout: 6000 })
        .toBe(true);
    });

    test('holds while the tab is hidden, and resumes when it is visible again', async ({ page }) => {
      await page.goto(d.path);
      await reveal(page, d.slug);
      const before = await marker(page, d.slug);
      await moved(page, d.slug, before);

      await page.evaluate(() => {
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await page.waitForTimeout(400);
      const parked = await marker(page, d.slug);
      await page.waitForTimeout(800);
      expect(await marker(page, d.slug), 'the token ran while the tab was hidden').toBe(parked);

      await page.evaluate(() => {
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await expect
        .poll(async () => (await marker(page, d.slug)) !== parked, { timeout: 6000 })
        .toBe(true);
    });
  });

  test.describe(`${d.slug}: the still picture`, () => {
    test.use({ reducedMotion: 'reduce' });

    test('shows the whole run with no pause control', async ({ page }) => {
      await page.goto(d.path);
      const figure = panel(page, d.slug);
      await expect(figure).toBeVisible();
      await expect(figure.locator('.flow-pause')).toHaveCount(0);
      /* The status names the state the finished run ends in, not the first step. */
      await expect(figure.locator('.flow-status')).toContainText(d.status);
      /* Every node on the first run's path is drawn as done. */
      for (const id of d.done) {
        await expect(figure.locator(`.flow-h [data-node="${id}"].is-done`), `${id} is not lit`).toHaveCount(1);
      }
    });
  });

  test.describe(`${d.slug}: the pre-render`, () => {
    test.use({ javaScriptEnabled: false });

    test('pictures the finished run before any script runs', async ({ page }) => {
      await page.goto(d.path);
      const figure = panel(page, d.slug);
      await expect(figure).toBeVisible();
      await expect(figure.locator('.flow-h .flow-node-name').first()).toBeAttached();
      await expect(figure.locator('.flow-pause')).toHaveCount(0);

      /* The same promise as the reduced-motion still, but read from the HTML that
         a visitor without JavaScript receives: the nodes are already lit. */
      for (const id of d.done) {
        await expect(figure.locator(`.flow-h [data-node="${id}"].is-done`), `${id} is unlit`).toHaveCount(1);
      }
      await expect(figure.locator('.flow-status')).toContainText(d.status);
    });
  });
}

test('the home page no longer carries the animated diagram', async ({ page }) => {
  /* The owner moved it into the case studies; that home slot is the Now panel. */
  await page.goto('/');
  await expect(page.locator('.flow-panel, .track-panel')).toHaveCount(0);
  await expect(page.locator('#now')).toBeVisible();
});

for (const d of DIAGRAMS) {
  test.describe(`${d.slug}: the panel`, () => {
    test('takes the full viewport width', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(d.path);
      const figure = panel(page, d.slug);
      await figure.scrollIntoViewIfNeeded();
      const box = (await figure.boundingBox())!;
      /* Edge to edge, give or take the scrollbar. */
      expect(box.x).toBeLessThanOrEqual(1);
      expect(box.x + box.width).toBeGreaterThanOrEqual(1440 - 18);
    });

    test('shows the whole graph without scrolling inside it at 1280 and 1440', async ({ page }) => {
      for (const width of [1280, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(d.path);
        const figure = panel(page, d.slug);
        await figure.scrollIntoViewIfNeeded();
        const geo = await figure.evaluate((el) => {
          const svg = el.querySelector('.flow-h .flow-svg') as SVGSVGElement;
          const r = svg.getBoundingClientRect();
          return { h: r.height, top: r.top, winH: innerHeight };
        });
        expect(geo.h, `chart is taller than the viewport at ${width}`).toBeLessThan(geo.winH);
        expect(geo.h).toBeGreaterThan(120);
      }
    });

    test('reflows top to bottom below 48rem, with no sideways scroll', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(d.path);
      const figure = panel(page, d.slug);
      await figure.scrollIntoViewIfNeeded();
      await expect(figure.locator('.flow-h')).toBeHidden();
      await expect(figure.locator('.flow-v')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    });

    test('keeps its labels at 12px or more on a phone', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(d.path);
      await panel(page, d.slug).scrollIntoViewIfNeeded();

      /* The font size in real pixels: the SVG scales, so the computed size is in
         viewBox units and has to be multiplied by the scale. */
      const smallest = await panel(page, d.slug).evaluate((el) => {
        const svg = el.querySelector('.flow-v .flow-svg') as SVGSVGElement;
        const scale = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
        const sizes = [...svg.querySelectorAll('.flow-node-name, .flow-node-detail, .flow-edge-label')].map(
          (t) => parseFloat(getComputedStyle(t).fontSize) * scale,
        );
        return Math.min(...sizes);
      });
      expect(smallest).toBeGreaterThanOrEqual(11.5);
    });

    test('red is used only for a refusal or a failure', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(d.path);
      const figure = panel(page, d.slug);
      await figure.scrollIntoViewIfNeeded();
      /* The first run reaches no failure, so in the still nothing is red. */
      await expect(figure.locator('.flow-h .flow-node.is-fail')).toHaveCount(0);
    });
  });
}
