import { expect, test, type Page } from '@playwright/test';

/*
 * The owner's flowchart brief (2026-11-17): no panel background, every edge visible
 * with a lit trail of the edges already crossed, a speed control and a Reset button.
 * Geometry is asserted here too: the one overlap left on 40c2b5c was the shared
 * departure run out of RannaGhor's Role check.
 */

const DIAGRAMS = [
  { slug: 'ticket-pipeline', path: '/work/ticket-pipeline', firstStatus: 'New ticket submitted' },
  { slug: 'rannaghor', path: '/work/rannaghor', firstStatus: 'A request arrives' },
];

const panel = (page: Page, slug: string) => page.locator(`.flow-panel[data-diagram="${slug}"]`);

const reveal = async (page: Page, slug: string) => {
  await panel(page, slug).scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
};

/* The page's own background, resolved to the rgb() the browser paints. */
const bg = (page: Page) =>
  page.evaluate(() => {
    const probe = document.createElement('div');
    probe.style.color = 'var(--bg)';
    document.body.appendChild(probe);
    const c = getComputedStyle(probe).color;
    probe.remove();
    return c;
  });

const token = (page: Page, slug: string) =>
  panel(page, slug).locator('.flow-h .flow-token').getAttribute('transform');

const trails = (page: Page, slug: string) =>
  panel(page, slug).locator('.flow-edge-lit.is-trail');

for (const d of DIAGRAMS) {
  test.describe(`${d.slug}: diagram surface`, () => {
    test('the panel has no background, and its pills match the page', async ({ page }) => {
      for (const theme of ['dark', 'light'] as const) {
        await page.setViewportSize({ width: 1280, height: 900 });
        await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
        await page.goto(d.path);
        await reveal(page, d.slug);
        const figure = panel(page, d.slug);
        const pageBg = await bg(page);

        const panelBg = await figure.evaluate((el) => getComputedStyle(el).backgroundColor);
        /* Either no fill at all, or exactly the page's ground: nothing of its own. */
        expect([pageBg, 'rgba(0, 0, 0, 0)', 'transparent']).toContain(panelBg);

        const pills = await figure.locator('.flow-edge-pill').evaluateAll((els) =>
          els.map((el) => getComputedStyle(el).fill),
        );
        expect(pills.length).toBeGreaterThan(0);
        for (const fill of pills) expect(fill, `${theme} pill fill`).toBe(pageBg);
      }
    });

    test('every edge is drawn in the track colour, full length, before the token reaches it', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(d.path);
      await reveal(page, d.slug);

      const edges = await panel(page, d.slug).evaluate((el) => {
        const svg = [...el.querySelectorAll('.flow-svg')].find(
          (s) => s.getBoundingClientRect().width > 0,
        ) as SVGSVGElement;
        const probe = document.createElement('div');
        probe.style.color = 'var(--track)';
        document.body.appendChild(probe);
        const track = getComputedStyle(probe).color;
        probe.remove();
        return [...svg.querySelectorAll<SVGPathElement>('path.flow-edge')].map((p) => ({
          id: p.getAttribute('data-edge') ?? '?',
          stroke: getComputedStyle(p).stroke,
          offset: getComputedStyle(p).strokeDashoffset,
          len: p.getTotalLength(),
          track,
        }));
      });

      expect(edges.length).toBeGreaterThan(0);
      for (const e of edges) {
        expect(e.len, `${e.id} has no length`).toBeGreaterThan(10);
        expect(e.stroke, `${e.id} is not in the track colour`).toBe(e.track);
        /* No offset: the base track shows end to end at all times. (Branch edges stay
           dashed, as they are by definition; a dash pattern draws rather than hides.) */
        expect(e.offset, `${e.id} is dashed out`).toMatch(/^(0|0px)$/);
      }
    });

    test('a crossed edge stays lit, the newest brightest, and a restart clears it', async ({
      page,
    }) => {
      test.setTimeout(120_000);
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(d.path);
      await reveal(page, d.slug);

      /* RannaGhor's first run crosses six edges before its closing dwell; three is
         enough to compare a newest with older ones. */
      await expect.poll(async () => trails(page, d.slug).count(), { timeout: 30_000 }).toBeGreaterThanOrEqual(3);

      const lit = await panel(page, d.slug).evaluate((el) => {
        const svg = [...el.querySelectorAll('.flow-svg')].find(
          (s) => s.getBoundingClientRect().width > 0,
        ) as SVGSVGElement;
        const probe = document.createElement('div');
        probe.style.color = 'var(--accent)';
        document.body.appendChild(probe);
        const accent = getComputedStyle(probe).color;
        probe.remove();
        return [...svg.querySelectorAll<SVGPathElement>('.flow-edge-lit.is-trail')].map((p) => ({
          id: p.getAttribute('data-edge-lit') ?? '?',
          accent,
          stroke: getComputedStyle(p).stroke,
          opacity: Number(getComputedStyle(p).opacity),
          newest: p.classList.contains('is-newest'),
        }));
      });

      const newest = lit.filter((l) => l.newest);
      expect(newest.length, 'one newest edge in the trail').toBe(1);
      for (const l of lit) {
        /* Lit means amber, and every older edge is still visible. */
        expect(l.stroke, `${l.id} is not lit`).toBe(l.accent);
        expect(l.opacity, `${l.id} is invisible`).toBeGreaterThan(0);
        if (!l.newest) {
          expect(l.opacity, `${l.id} is not dimmer than the newest`).toBeLessThan(newest[0].opacity);
        }
      }

      /* The trail is of this run only: when the clock wraps, it clears. */
      await expect.poll(async () => trails(page, d.slug).count(), { timeout: 90_000 }).toBe(0);
    });
  });

  test.describe(`${d.slug}: speed`, () => {
    test('offers 0.75x, 1x and 1.5x, defaults to 1x, and changes the pace', async ({ page }) => {
      test.setTimeout(120_000);
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(d.path);
      await reveal(page, d.slug);
      const figure = panel(page, d.slug);

      const options = figure.locator('.flow-speed [role="button"], .flow-speed button');
      await expect(options).toHaveCount(3);
      await expect(options).toHaveText(['0.75x', '1x', '1.5x']);
      await expect(figure.getByRole('button', { name: '1x' })).toHaveAttribute('aria-pressed', 'true');
      await expect(figure.getByRole('button', { name: '0.75x' })).toHaveAttribute('aria-pressed', 'false');

      /* Reset restarts the first run; the lit overlay's own dash offset is the distance
         the token has covered along the first edge, so it measures the clock directly. */
      const progress = async (speed: '1x' | '1.5x', ms: number) => {
        const pause = figure.getByRole('button', { name: /pause the diagram/i });
        if (await pause.isVisible()) await pause.click();
        await figure.getByRole('button', { name: speed, exact: true }).click();
        /* Let the speed click commit before the clock restarts, so the measurement is
           of the chosen speed and not of the old one for a frame. */
        await page.waitForTimeout(80);
        await figure.getByRole('button', { name: /reset the diagram/i }).click();
        const travelled = await figure.evaluate(async (el, windowMs) => {
          const svg = [...el.querySelectorAll('.flow-svg')].find(
            (s) => s.getBoundingClientRect().width > 0,
          ) as SVGSVGElement;
          const first = svg.querySelector<SVGPathElement>('.flow-edge-lit')!;
          const before = parseFloat(first.style.strokeDashoffset);
          await new Promise((r) => setTimeout(r, windowMs));
          const after = parseFloat(first.style.strokeDashoffset);
          return before - after;
        }, ms);
        await figure.getByRole('button', { name: /pause the diagram/i }).click();
        return travelled;
      };

      const slow = await progress('1x', 200);
      const fast = await progress('1.5x', 200);
      const ratio = fast / slow;
      expect(slow, 'the token did not move').toBeGreaterThan(20);
      expect(ratio, `1x covered ${slow.toFixed(1)} units, 1.5x ${fast.toFixed(1)}`).toBeGreaterThan(1.2);
      expect(ratio, `1x covered ${slow.toFixed(1)} units, 1.5x ${fast.toFixed(1)}`).toBeLessThan(1.8);
    });

    test('is operable and announced by keyboard', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(d.path);
      await reveal(page, d.slug);
      const figure = panel(page, d.slug);
      await expect(figure.locator('.flow-speed')).toBeVisible();

      /* Start on the Pause control: Reset is absent while playing, so the next Tab
         lands on the first speed option. */
      await figure.getByRole('button', { name: /pause the diagram/i }).focus();
      await page.keyboard.press('Tab');
      const onSpeed = await page.evaluate(
        () => document.activeElement?.classList.contains('flow-speed-option') ?? false,
      );
      expect(onSpeed, 'the speed control is not reachable by Tab').toBe(true);
      await page.keyboard.press('Enter');
      const pressed = await page.evaluate(() => document.activeElement?.getAttribute('aria-pressed'));
      expect(pressed).toBe('true');
    });
  });

  test.describe(`${d.slug}: reset`, () => {
    test('shows only while paused, and restarts the first run with an empty trail', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(d.path);
      await reveal(page, d.slug);
      const figure = panel(page, d.slug);

      /* Playing: no Reset. */
      await expect(figure.locator('.flow-reset')).toHaveCount(0);
      await expect.poll(async () => trails(page, d.slug).count(), { timeout: 20_000 }).toBeGreaterThanOrEqual(1);

      await figure.getByRole('button', { name: /pause the diagram/i }).click();
      const reset = figure.getByRole('button', { name: /reset the diagram/i });
      await expect(reset).toBeVisible();
      await reset.click();

      /* The trail is gone, the first step is on screen, and it is playing again. */
      await expect(figure.getByRole('button', { name: /pause the diagram/i })).toBeVisible();
      await expect(figure.locator('.flow-reset')).toHaveCount(0);
      await expect(figure.locator('.flow-edge-lit.is-trail')).toHaveCount(0);
      await expect(figure.locator('.flow-status')).toContainText(d.firstStatus);
      await expect.poll(async () => token(page, d.slug), { timeout: 6_000 }).toBeTruthy();
      const from = await token(page, d.slug);
      await expect.poll(async () => (await token(page, d.slug)) !== from, { timeout: 6_000 }).toBe(true);
    });
  });

  test.describe(`${d.slug}: reduced motion`, () => {
    test.use({ reducedMotion: 'reduce' });

    test('offers no animation controls at all', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(d.path);
      await reveal(page, d.slug);
      const figure = panel(page, d.slug);
      await expect(figure).toBeVisible();
      await expect(figure.locator('.flow-pause')).toHaveCount(0);
      await expect(figure.locator('.flow-speed')).toHaveCount(0);
      await expect(figure.locator('.flow-reset')).toHaveCount(0);
      /* The lit layer exists for the live chart only; in the still it is invisible, so
         the picture is the finished-run drawing rather than a frozen trail. */
      const lit = await figure.locator('.flow-edge-lit').evaluateAll((els) =>
        els.map((el) => getComputedStyle(el).opacity),
      );
      expect(lit.length).toBeGreaterThan(0);
      for (const opacity of lit) expect(opacity).toBe('0');
    });
  });
}

/* ---------------------------------------------------------------- geometry */

const WIDTHS = [1440, 1280, 1024, 834, 390];

for (const d of DIAGRAMS) {
  test.describe(`${d.slug}: no two edges run together`, () => {
    for (const width of WIDTHS) {
      test(`${width}px: no edge shares a segment with another`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto(d.path);
        await panel(page, d.slug).scrollIntoViewIfNeeded();

        const shared = await panel(page, d.slug).evaluate((el) => {
          const svg = [...el.querySelectorAll('.flow-svg')].find(
            (s) => s.getBoundingClientRect().width > 0,
          ) as SVGSVGElement;
          const ctm = svg.getScreenCTM()!;
          const toPage = (p: { x: number; y: number }) => ({
            x: ctm.a * p.x + ctm.c * p.y + ctm.e,
            y: ctm.b * p.x + ctm.d * p.y + ctm.f,
          });
          const edges = [...svg.querySelectorAll<SVGPathElement>('path.flow-edge')].map((path) => {
            const len = path.getTotalLength();
            const pts: { x: number; y: number }[] = [];
            for (let t = 0; t <= len; t += 3) pts.push(toPage(path.getPointAtLength(t)));
            pts.push(toPage(path.getPointAtLength(len)));
            return { id: path.getAttribute('data-edge') ?? '?', pts };
          });

          const out: string[] = [];
          for (let i = 0; i < edges.length; i++) {
            for (let j = i + 1; j < edges.length; j++) {
              const A = edges[i];
              const B = edges[j];
              let run = 0;
              let best = Infinity;
              for (const p of A.pts) {
                let near = Infinity;
                for (const q of B.pts) near = Math.min(near, Math.hypot(p.x - q.x, p.y - q.y));
                if (near <= 2) {
                  run += 3;
                  best = Math.min(best, near);
                } else {
                  run = 0;
                }
                if (run > 8) break;
              }
              /* Shared endpoints at a box are allowed; a parallel run over 8px is not. */
              if (run > 8) out.push(`${A.id} ~ ${B.id}, ${best.toFixed(1)}px apart for >8px`);
            }
          }
          return out;
        });

        expect(shared, 'edges sharing a segment').toEqual([]);
      });
    }

    for (const width of [1440, 1280]) {
      test(`${width}px: the gaps between boxes are even`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto(d.path);
        await panel(page, d.slug).scrollIntoViewIfNeeded();

        const uneven = await panel(page, d.slug).evaluate((el) => {
          const svg = [...el.querySelectorAll('.flow-svg')].find(
            (s) => s.getBoundingClientRect().width > 0,
          ) as SVGSVGElement;
          const rows = new Map<number, DOMRect[]>();
          for (const n of svg.querySelectorAll('.flow-node')) {
            const r = n.querySelector('rect')!.getBoundingClientRect();
            const key = Math.round(r.top);
            rows.set(key, [...(rows.get(key) ?? []), r]);
          }
          const out: string[] = [];
          for (const [top, boxes] of rows) {
            if (boxes.length < 3) continue;
            const sorted = [...boxes].sort((a, b) => a.left - b.left);
            const gaps = sorted.slice(1).map((b, i) => b.left - sorted[i].right);
            const spread = Math.max(...gaps) - Math.min(...gaps);
            if (spread > 1.5) out.push(`row at ${top}: gaps ${gaps.map((g) => g.toFixed(1)).join(', ')}`);
          }
          return out;
        });

        expect(uneven, 'rows with uneven gaps').toEqual([]);
      });
    }
  });
}
