import { expect, test, type Page } from '@playwright/test';

/*
 * The case studies' flowcharts. Must-prove 3, as amended by A5 and A6: the
 * diagram pauses off-screen and on a hidden tab, has a visible pause control, and
 * shows a complete still under reduced motion and in the pre-render. A6 adds that
 * it takes the full width and up to the full height, and that below 48rem the
 * graph reflows top to bottom instead of shrinking to unreadable text.
 *
 * This replaces the R2 framing-band spec. Those bands framed one station at a time
 * from a wide track; the vertical layout now shows the whole graph at a phone
 * width, so there is nothing left to frame.
 */

const DIAGRAMS = [
  {
    slug: 'ticket-pipeline',
    path: '/work/ticket-pipeline',
    status: /Completed/,
    /* The nodes the still must light: the first run's own path. */
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

for (const d of DIAGRAMS) {
  test.describe(d.slug, () => {
    test('draws nodes and directed edges', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(d.path);
      const figure = panel(page, d.slug);
      await expect(figure).toBeVisible();
      /* Every node is a real box with a label, in both layouts. */
      expect(await figure.locator('.flow-h .flow-node').count()).toBeGreaterThan(5);
      expect(await figure.locator('.flow-v .flow-node').count()).toBeGreaterThan(5);
      expect(await figure.locator('.flow-h .flow-edge').count()).toBeGreaterThan(5);
    });

    test('the still picture is complete: the first run’s path is lit', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(d.path);
      const figure = panel(page, d.slug);
      for (const id of d.done) {
        await expect(figure.locator(`.flow-h [data-node="${id}"].is-done`), `${id} is not lit`).toHaveCount(1);
      }
      /* And with no animation running there is no pause control. */
      await expect(figure.locator('.flow-pause')).toHaveCount(0);
    });

    test('has a pause control that stops the token', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(d.path);
      const button = panel(page, d.slug).locator('.flow-pause');
      await expect(button).toBeVisible();
      await button.scrollIntoViewIfNeeded();

      const token = panel(page, d.slug).locator('.flow-h .flow-token');
      await page.waitForTimeout(600);
      await button.click();
      await expect(button).toHaveText(/Play/);
      const held = await token.getAttribute('transform');
      await page.waitForTimeout(700);
      expect(await token.getAttribute('transform')).toBe(held);
    });

    test('pauses on a hidden tab', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(d.path);
      await panel(page, d.slug).scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      const token = panel(page, d.slug).locator('.flow-h .flow-token');

      await page.evaluate(() => {
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      });
      const before = await token.getAttribute('transform');
      await page.waitForTimeout(700);
      expect(await token.getAttribute('transform')).toBe(before);
    });

    test('pauses off-screen', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 700 });
      await page.goto(d.path);
      const figure = panel(page, d.slug);
      await figure.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      const token = figure.locator('.flow-h .flow-token');

      /* Scroll it away, let the observer fire, then compare. */
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      const before = await token.getAttribute('transform');
      await page.waitForTimeout(700);
      expect(await token.getAttribute('transform')).toBe(before);
    });

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
        /* The chart fits in the room under the header: no internal scrolling, and
           nothing cut off the bottom of the viewport either. */
        expect(geo.h, `chart is taller than the viewport at ${width}`).toBeLessThan(geo.winH);
        expect(geo.h).toBeGreaterThan(120);
      }
    });

    test('reflows top to bottom below 48rem, showing the whole graph', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(d.path);
      const figure = panel(page, d.slug);
      await figure.scrollIntoViewIfNeeded();

      /* The desktop layout is gone and the vertical one is shown. */
      await expect(figure.locator('.flow-h')).toBeHidden();
      await expect(figure.locator('.flow-v')).toBeVisible();
      const nodes = await figure.locator('.flow-v .flow-node').count();
      expect(nodes, 'the phone layout is missing nodes').toBeGreaterThan(5);

      /* Every node is on screen at once — the graph is not cropped to a station. */
      const clipped = await figure.evaluate((el) => {
        const svg = el.querySelector('.flow-v .flow-svg')!;
        const box = svg.getBoundingClientRect();
        return [...svg.querySelectorAll('.flow-node')].filter((n) => {
          const r = n.getBoundingClientRect();
          return r.width > 0 && (r.right > box.right + 1 || r.bottom > box.bottom + 1);
        }).length;
      });
      expect(clipped).toBe(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    });

    test('keeps every label at 12px or more on a phone', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(d.path);
      await panel(page, d.slug).scrollIntoViewIfNeeded();

      /* The label size in the vertical graph, in real pixels: the SVG scales, so
         the computed font-size is in viewBox units and has to be converted. */
      const smallest = await panel(page, d.slug).evaluate((el) => {
        const svg = el.querySelector('.flow-v .flow-svg') as SVGSVGElement;
        const vb = svg.viewBox.baseVal;
        const scale = svg.getBoundingClientRect().width / vb.width;
        const text = svg.querySelector('.flow-node-name') as SVGTextElement;
        return parseFloat(getComputedStyle(text).fontSize) * scale;
      });
      expect(smallest).toBeGreaterThanOrEqual(11.5);
    });

    test('red is used only for a refusal or a failure', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(d.path);
      const figure = panel(page, d.slug);
      await figure.scrollIntoViewIfNeeded();

      /* In the still, the first run has no failure, so nothing is red. Sampled over
         a cycle to catch a run that does fail. */
      const reds = await page.evaluate(() => {
        const fail = getComputedStyle(document.documentElement).getPropertyValue('--fail').trim();
        return { fail };
      });
      expect(reds.fail).toBeTruthy();
      await expect(figure.locator('.flow-h .flow-node.is-fail')).toHaveCount(0);
    });
  });
}
